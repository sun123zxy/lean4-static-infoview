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

/-- Collect tactic state information from info trees with deduplication -/
def collectInfoFromTrees (trees : PersistentArray InfoTree) (fileMap : FileMap) :
    IO (Lean.Json × Array Lean.Json) := do
  let resultsRef ← IO.mkRef #[]
  let seenRef ← IO.mkRef #[]
  let infoStringsRef ← IO.mkRef #[]
  let infoMapRef ← IO.mkRef (Lean.RBMap.empty : Lean.RBMap String Nat compare)

  for tree in trees do
    let _ ← tree.visitM (m := IO) (α := Unit) (preNode := fun ctx info _ => do
      match info with
      | .ofTacticInfo ti =>
        if let some range := ti.stx.getRange? then
          let lspPos := fileMap.toPosition range.start
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

            -- Get or create info string ID for deduplication
            let infoMap ← infoMapRef.get
            let infoId ← match infoMap.find? goalsBeforeStr with
              | some id => pure id
              | none =>
                let infoStrings ← infoStringsRef.get
                let newId := infoStrings.size
                infoStringsRef.set (infoStrings.push goalsBeforeStr)
                infoMapRef.set (infoMap.insert goalsBeforeStr newId)
                pure newId

            let json := Lean.Json.mkObj [
              ("line", lspPos.line),
              ("column", lspPos.column),
              ("offset", offset),
              ("info_id", infoId)
            ]
            resultsRef.modify (·.push json)
        return true

      | _ => return true) (fun _ _ _ _ => pure ())

  let infoStrings ← infoStringsRef.get
  let infoArray := Lean.Json.arr (infoStrings.map Lean.Json.str)
  let results ← resultsRef.get
  return (infoArray, results)

/-- Process a Lean file and extract all info tree data -/
def processFile (fileName : String) : IO Unit := do
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

  -- Extract and collect info from trees
  let trees := s.commandState.infoState.trees.toArray
  let (infoArray, positions) ← collectInfoFromTrees trees.toPArray' inputCtx.fileMap

  -- Write JSON output
  let jsonOutput := Lean.Json.mkObj [
    ("source", source),
    ("info_strings", infoArray),
    ("positions", Lean.Json.arr positions)
  ]

  IO.FS.writeFile "info.json" jsonOutput.pretty
  IO.println "Generated info.json"

def main (args : List String) : IO Unit := do
  match args with
  | [fileName] => processFile fileName
  | _ =>
    IO.println "Usage: staticInfoView <lean-file>"
    IO.println "Example: staticInfoView Examples/Basic.lean"
