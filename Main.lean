import Lean

open Lean Elab Command Meta Tactic
open System (FilePath)

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
        let typeStr := toString (← ppExpr type)
        result := result ++ s!"{name} : {typeStr}\n"

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

/-- Collect tactic state information from info trees and generate HTML -/
def collectInfoFromTrees (trees : PersistentArray InfoTree) (source : String) :
    IO String := do
  -- Build array of (offset, goalText) pairs
  let positionsRef ← IO.mkRef #[]
  let seenRef ← IO.mkRef #[]

  for tree in trees do
    let _ ← tree.visitM (m := IO) (α := Unit) (preNode := fun ctx info _ => do
      match info with
      | .ofTacticInfo ti =>
        if let some range := ti.stx.getRange? then
          let offset := range.start.byteIdx

          -- Check if we've already seen this offset
          let seen ← seenRef.get
          let key := (offset, "tactic")
          if !seen.contains key then
            seenRef.modify (·.push key)

            -- Get goals before this tactic
            let goalsBeforeStr ← ctx.runMetaM {} (do
              let goalsBefore := ti.goalsBefore
              if goalsBefore.isEmpty then
                return "No goals"
              else
                let goalsArray := goalsBefore.toArray
                let mut result := s!"Goals: {goalsArray.size}\n\n"
                for idx in [:goalsArray.size] do
                  let mvarId := goalsArray[idx]!
                  if idx > 0 then
                    result := result ++ "\n---\n\n"
                  result := result ++ s!"Goal {idx + 1}:\n"
                  result := result ++ (← formatGoal mvarId)
                return result)

            positionsRef.modify (·.push (offset, goalsBeforeStr))
        return true

      | _ => return true) (fun _ _ _ _ => pure ())

  let positions ← positionsRef.get
  -- Sort by offset
  let sortedPositions := positions.qsort (fun a b => a.1 < b.1)

  -- Generate HTML with plain text and markers
  let mut html := ""
  let mut currentPos := 0

  for (offset, goalText) in sortedPositions do
    -- Add text before this position
    if currentPos < offset then
      let textSegment := String.Pos.Raw.extract source ⟨currentPos⟩ ⟨offset⟩
      -- Escape HTML characters
      let escaped := textSegment.replace "&" "&amp;" |>.replace "<" "&lt;" |>.replace ">" "&gt;"
      html := html ++ escaped

    -- Insert goal marker
    let escapedGoal := goalText.replace "&" "&amp;" |>.replace "<" "&lt;" |>.replace ">" "&gt;"
    html := html ++ s!"<span class=\"goal-marker\" data-goal=\"{escapedGoal}\"></span>"
    currentPos := offset

  -- Add remaining text
  if currentPos < source.utf8ByteSize then
    let textSegment := String.Pos.Raw.extract source ⟨currentPos⟩ ⟨source.utf8ByteSize⟩
    let escaped := textSegment.replace "&" "&amp;" |>.replace "<" "&lt;" |>.replace ">" "&gt;"
    html := html ++ escaped

  return html

/-- Process a Lean file and extract all info tree data -/
def processFile (fileName : String) (outputFile : Option String := none) : IO Unit := do
  -- Enable initializers execution, required for frontend-like projects
  unsafe enableInitializersExecution

  -- Determine output filename
  let outputPath := match outputFile with
    | some path => path
    | none =>
      -- Extract basename without path and replace .lean with .html
      let baseName := FilePath.mk fileName |>.fileName.getD fileName
      baseName.stripSuffix ".lean" ++ ".html"
  -- Initialize Lean environment
  initSearchPath (← findSysroot)

  let source ← IO.FS.readFile fileName
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
  let html ← collectInfoFromTrees trees.toPArray' source

  -- Write HTML output
  IO.FS.writeFile outputPath html
  IO.println s!"Generated {outputPath}"

def main (args : List String) : IO Unit := do
  match args with
  | [fileName] => processFile fileName none
  | ["-o", outputFile, fileName] => processFile fileName (some outputFile)
  | [fileName, "-o", outputFile] => processFile fileName (some outputFile)
  | _ =>
    IO.println "Usage: staticInfoView [options] <lean-file>"
    IO.println "Options:"
    IO.println "  -o <file>    Specify output file (default: <input>.html)"
    IO.println "Example: staticInfoView Examples/Basic.lean"
    IO.println "         staticInfoView -o output.html Examples/Basic.lean"
