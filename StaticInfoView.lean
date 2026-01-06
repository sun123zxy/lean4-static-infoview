import Lean

open Lean Elab Command Meta Tactic
open System (FilePath)

/-- Export options for controlling what information to include -/
structure ExportOptions where
  exportGoals : Bool := false
  exportTerms : Bool := false
deriving Repr

def escapeHtml (s : String) : String :=
  s.replace "&" "&amp;"
   |>.replace "<" "&lt;"
   |>.replace ">" "&gt;"
   |>.replace "\"" "&quot;"
   |>.replace "'" "&#39;"

/-- Format a single goal with its hypotheses and target -/
def formatGoal (mvarId : MVarId) : MetaM String := do
  let mvarDecl ← mvarId.getDecl
  let lctx := mvarDecl.lctx

  -- Use the local context when pretty-printing
  withLCtx lctx mvarDecl.localInstances do
    let target ← instantiateMVars mvarDecl.type

    let mut result := ""

    -- Format hypotheses
    for localDecl in lctx do
      if !localDecl.isAuxDecl && !localDecl.isImplementationDetail then
        let name := localDecl.userName
        let type ← instantiateMVars localDecl.type

        -- Simplify names for anonymous instances with macro scopes
        let displayName :=
          if name.hasMacroScopes then
            -- Extract the base name before macro scopes (e.g., "inst" from "inst._@....")
            let nameStr := name.toString
            let baseName := (nameStr.splitOn ".").head!
            baseName
          else
            name.toString

        let typeStr := toString (← ppExpr type)
        result := result ++ s!"{displayName} : {typeStr}\n"

        -- Show let bindings
        if let some val := localDecl.value? then
          let valStr := toString (← ppExpr val)
          result := result ++ s!"  := {valStr}\n"

    -- Format target
    if result != "" then
      result := result ++ "⊢ "
    let targetStr := toString (← ppExpr target)
    result := result ++ targetStr

    return result

/-- Collect tactic state and term type information from info trees and generate HTML -/
def collectInfoFromTrees (trees : PersistentArray InfoTree) (source : String) (options : ExportOptions) :
    IO String := do
  -- Collect positions and goal text for each tactic
  let positionsRef ← IO.mkRef #[]
  let seenRef ← IO.mkRef (∅ : Std.HashSet Nat)
  -- Collect term ranges and types
  let termRangesRef ← IO.mkRef #[]

  for tree in trees do
    let _ ← tree.visitM (m := IO) (α := Unit) (preNode := fun ctx info _ => do
      match info with
      | .ofTacticInfo ti =>
        if !options.exportGoals then
          return true
        if let some range := ti.stx.getRange? then
          let offset := range.start.byteIdx
          -- Check if we've already seen this offset
          let seen ← seenRef.get
          if !seen.contains offset then
            seenRef.modify (·.insert offset)

            -- Get goals before this tactic
            let goalsBeforeStr ← ctx.runMetaM {} (do
              let goalsBefore := ti.goalsBefore
              if goalsBefore.isEmpty then
                return "No goals"
              else
                let goalsArray := goalsBefore.toArray
                let mut result := s!"Goals: {goalsArray.size}\n\n"
                for idx in [:goalsArray.size] do
                  if let some mvarId := goalsArray[idx]? then
                    if idx > 0 then
                      result := result ++ "\n---\n\n"
                    result := result ++ s!"Goal {idx + 1}:\n"
                    result := result ++ (← formatGoal mvarId)
                return result)

            positionsRef.modify (·.push (offset, goalsBeforeStr))
        return true

      | .ofTermInfo ti =>
        if !options.exportTerms then
          return true
        if let some range := ti.stx.getRange? then
          -- Extract type information for this term
          let typeStr ← ctx.runMetaM ti.lctx (do
            let expr ← instantiateMVars ti.expr
            let type ← inferType expr
            let typeStr := toString (← ppExpr type)
            return typeStr)

          termRangesRef.modify (·.push (range.start.byteIdx, range.stop.byteIdx, typeStr))
        return true

      | _ => return true) (fun _ _ _ _ => pure ())

  let positions ← positionsRef.get
  let termRanges ← termRangesRef.get

  -- Deduplicate term ranges - keep only unique (start, end) pairs
  let mut seenRanges : Std.HashSet (Nat × Nat) := ∅
  let mut uniqueTerms := #[]
  for (termStart, termEnd, termType) in termRanges do
    let key := (termStart, termEnd)
    -- Skip invalid or zero-length ranges
    if termStart < termEnd && !seenRanges.contains key then
      seenRanges := seenRanges.insert key
      uniqueTerms := uniqueTerms.push (termStart, termEnd, termType)

  -- Build start and end events
  -- Start events: (position, type data) - for opening spans
  -- End events: just positions where spans close (all </span> tags are identical)
  let mut startEvents : Array (Nat × String) := #[]
  let mut endEvents : Array Nat := #[]

  -- Add goal marker events as start events
  for (offset, goalText) in positions do
    startEvents := startEvents.push (offset, s!"<goal>{escapeHtml goalText}")

  -- Add term start/end events
  for (termStart, termEnd, termType) in uniqueTerms do
    startEvents := startEvents.push (termStart, s!"<term>{escapeHtml termType}")
    endEvents := endEvents.push termEnd

  -- Sort start events by position
  let sortedStarts := startEvents.qsort (fun a b => a.1 < b.1)

  -- Sort end events by position (order doesn't matter for same position - all </span> are identical)
  let sortedEnds := endEvents.qsort (fun a b => a < b)

  -- Generate HTML by processing events
  let mut html := ""
  let mut codeHtml := ""

  let mut currentPos := 0
  let mut startIndex := 0
  let mut endIndex := 0

  while currentPos < source.rawEndPos.byteIdx do
    -- Process all END events at this position (close spans)
    while endIndex < sortedEnds.size do
      let endPos := sortedEnds[endIndex]!
      if endPos != currentPos then
        break
      codeHtml := codeHtml ++ "</span>"
      endIndex := endIndex + 1

    -- Process all START events at this position (open spans or insert markers)
    while startIndex < sortedStarts.size do
      let (startPos, eventData) := sortedStarts[startIndex]!
      if startPos != currentPos then
        break

      if eventData.startsWith "<goal>" then
        let goalText := eventData.drop 6
        codeHtml := codeHtml ++ s!"<span class=\"goal-marker\" data-goal='{goalText}'></span>"
      else if eventData.startsWith "<term>" then
        let termType := eventData.drop 6
        codeHtml := codeHtml ++ s!"<span class=\"term-marker\" data-type='{termType}'>"

      startIndex := startIndex + 1

    -- Finally, add the character at current position
    let char := String.Pos.Raw.get source ⟨currentPos⟩
    codeHtml := codeHtml ++ escapeHtml (String.ofList [char])
    currentPos := String.Pos.Raw.next source ⟨currentPos⟩ |>.byteIdx

  -- Wrap in <pre><code> structure with meta-info span before it
  html := s!"<span class=\"meta-info\" data-export-goals='{options.exportGoals}' data-export-terms='{options.exportTerms}' style='display:none;'></span>"
  html := html ++ "<pre><code class=\"infoview-lean\">"
  html := html ++ codeHtml
  html := html ++ "</code></pre>"

  return html

/-- Process a Lean file and extract all info tree data -/
def processFile (fileName : String) (outputFile : Option String := none) (options : ExportOptions := {}) : IO Unit := do
  -- Enable initializers execution, required for frontend-like projects
  unsafe enableInitializersExecution

  -- Determine output filename
  let outputPath := match outputFile with
    | some path => path
    | none =>
      -- Extract basename without path and replace .lean with .html
      let baseName := FilePath.mk fileName |>.fileName.getD fileName
      baseName.stripSuffix ".lean" ++ ".html"

  -- Initialize Lean environment - uses LEAN_PATH environment variable (should be set by lake env)
  initSearchPath (← findSysroot)

  -- This make sure that the file is read with LF line endings
  -- Can cause severe offsets otherwise on Windows
  let source := String.crlfToLf (← IO.FS.readFile fileName)
  let inputCtx := Parser.mkInputContext source fileName

  let (header, parserState, messages) ← Parser.parseHeader inputCtx
  let (env, messages) ← processHeader header {} messages inputCtx

  if messages.hasErrors then
    for msg in messages.toList do
      if msg.severity == .error then
        IO.println s!"Error: {← msg.toString}"
    throw <| IO.userError "Errors during import; aborting"

  let env := env.setMainModule (← moduleNameOfFileName fileName none)
  let commandState := { Command.mkState env messages {} with infoState.enabled := true }
  let s ← IO.processCommands inputCtx parserState commandState

  -- Extract and generate HTML from trees
  let trees := s.commandState.infoState.trees.toArray
  let html ← collectInfoFromTrees trees.toPArray' source options

  -- Write HTML output
  IO.FS.writeFile outputPath html
  IO.println s!"Generated {outputPath}"

def main (args : List String) : IO Unit := do
  let mut options : ExportOptions := {}
  let mut outputFile : Option String := none
  let mut fileName : Option String := none
  let mut i := 0

  while i < args.length do
    let arg := args[i]!
    if arg == "-o" then
      i := i + 1
      if i < args.length then
        outputFile := some args[i]!
      else
        IO.println "Error: -o requires an output filename"
        return
    else if arg == "-g" then
      -- Only export goals
      options := { options with exportGoals := true }
    else if arg == "-t" then
      -- Only export terms
      options := { options with exportTerms := true }
    else if arg.startsWith "-" then
      IO.println s!"Error: Unknown option {arg}"
      return
    else
      fileName := some arg
    i := i + 1

  match fileName with
  | some file =>
    processFile file outputFile options
  | none =>
    IO.println "Usage: staticInfoView [options] <lean-file>"
    IO.println "Options:"
    IO.println "  -g           Export goal/tactic information"
    IO.println "  -t           Export term type information"
    IO.println "  -o <file>    Specify output file (default: <input>.html)"
    IO.println ""
    IO.println "Examples: "
    IO.println "  staticInfoView path/to/FileToBeAnalyzed.lean -o output.html -g -t"
