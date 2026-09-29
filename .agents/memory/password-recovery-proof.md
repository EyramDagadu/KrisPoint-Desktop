---
name: Password recovery proof
description: Security invariant for account recovery across Solo and Hospital editions.
---

Password reset must require a short-lived server-verifiable proof from a correct security answer. Bind that proof to the current password and answer so either change revokes it, consume it via a conditional update, and limit guesses in shared state.

**Why:** The former recovery UI verified an answer, but the reset endpoint accepted only a username and new password; bypassing the UI allowed an unverified reset. The first-account form also collected a question and answer that registration silently discarded.

**How to apply:** Any change to account setup, security questions, password recovery, or reset authorization must preserve server-side proof checking and persisted answer enrollment in both editions. Historical setup answers that were never saved cannot be reconstructed.