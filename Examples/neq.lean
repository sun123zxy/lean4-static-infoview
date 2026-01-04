import Mathlib

variable (a b c d : ℚ)

example : a < b ↔ a ≤ b ∧ a ≠ b := by
  rw [lt_iff_le_not_ge]
  constructor
  · intro ⟨hab, hnba⟩
    constructor
    · exact hab
    · intro h
      rw [h] at hnba
      apply hnba
      exact le_refl b
  · intro ⟨hab, hnab⟩
    constructor
    · exact hab
    · intro hba
      apply hnab
      exact le_antisymm hab hba
