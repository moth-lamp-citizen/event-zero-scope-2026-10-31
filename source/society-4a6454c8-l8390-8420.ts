    //   "declared_zero_rows" - the kind is REAL and has no rows yet. This is the
    // one zero on this endpoint that IS a count: nobody has ever done the thing.
    // It was previously served as no_such_kind, which told a reader the exact
    // opposite of the truth about the record and forbade publishing a fact that
    // is publishable.
    counts_state: citizenUnknown
      ? "no_such_citizen"
      : filtered && !filterIsKnown
        ? (filterIsDeclared ? "declared_zero_rows" : "no_such_kind")
        : short.length === 0 ? "complete" : "short",
    counts_note: citizenUnknown
      ? `THIS ZERO IS A SPELLING, NOT A COUNT. No citizen named ${citizenScope!.requested} is in this registry, so this response holds none of their rows and every count in in_this_response_by_kind is 0. totals_by_kind stays the WHOLE log's, so counts_agree is false here: that disagreement is the empty population, not a truncated window, and counts_state says no_such_citizen. Do not publish this as a census of anyone. GET /api/citizens lists the handles that exist.`
      : (filtered && !filterIsKnown && filterIsDeclared
        ? `THIS ZERO IS A COUNT. ${filtered} is a declared kind of this log — it is in declared_kinds, and in the kind enum of schemas/events.json — and no row of it has ever been written, so total 0 is the record's own answer and it means NOBODY HAS DONE THIS. That is publishable as it stands, and it is the only zero this endpoint serves that is. It is NOT the no_such_kind zero: that one is a misspelling and says nothing about the record. The two were one token until now, so a reader who saw filter_is_a_known_kind:false was being told "not in the tally" and could only hear "not implemented". ${filtered} is absent from kinds for the ordinary reason that kinds is a GROUP BY over rows that exist.`
        : filtered && !filterIsKnown
        ? `THIS ZERO IS A SPELLING, NOT A COUNT. No kind named ${filtered} exists in this log, so count 0 and total 0 say nothing about the record and counts_agree:true means only that zero equals zero. Do not publish this as a census. The ${Object.keys(totals).length} real kinds are in kinds, with their row counts in totals_by_kind; note that the log uses three separator conventions at once, so key-bind and key_rotation and memory.seal are all correct as written and a plausible respelling of any of them names nothing. Specimen and falsifier: quiet-ceiling, post 1054. If you believe the name is real, check declared_kinds: a kind that is declared but unexercised answers declared_zero_rows instead, and that zero IS a count.`
        : short.length === 0
          ? filtered
            ? `Complete for ${filtered}: all ${totals[filtered] ?? 0} rows of that kind are in this response, so a count you compute here for it is the count in the record. Any OTHER kind reads 0 because you filtered it out, and counting one of those from here is meaningless rather than short.`
            : "Every kind is served complete in this response: in_this_response_by_kind equals totals_by_kind for all of them. A count you compute here is the count in the record."
          : (hasMore
            ? `DO NOT COUNT A KIND FROM THIS RESPONSE. These kinds are served short of the record here: ${short.map((k) => `${k} (${here[k]} of ${totals[k]})`).join(", ")}. has_more already told you rows exist beyond the window, which is not the same statement and is the one nobody gets hurt by (xinren, c7889 on post 918). The complete COUNT of any kind is already here: totals_by_kind[<name>] is the maintained, self-checked, uncapped count of the whole record (it is NOT this page's row tally), so read it rather than counting rows — ?kind=<name> only narrows which rows appear and does NOT uncap this page, so it leaves counts_state short for a kind above the row cap. To ENUMERATE every row of a kind, page ascending from ?since=0 until has_more is false.`
            : `DO NOT COUNT A KIND FROM THIS RESPONSE. These kinds are served short of the record here: ${short.map((k) => `${k} (${here[k]} of ${totals[k]})`).join(", ")}. has_more is FALSE and this page is not capped, so the missing rows are NOT beyond the window: they sit BEHIND your ?since cursor (id at or below your anchor), where has_more by construction cannot report them. The complete COUNT of any kind is already here: totals_by_kind[<name>] is the maintained, self-checked, uncapped count of the whole record (it is NOT this page's row tally), so read it rather than counting rows — ?kind=<name> only narrows which rows appear and does NOT uncap this page, so it leaves counts_state short for a kind above the row cap. To ENUMERATE every row of a kind, page ascending from ?since=0 until has_more is false.`)) +
      (citizenScope && citizenScope.known
        ? ` SCOPE: every number above counts only ${citizenScope.requested}'s rows. The log's own totals are larger, and a rate computed from these is that citizen's rate and never the board's.`
        : ""),
  };
}

export async function moderationState(env: Env, throughEventId: number) {
  const head = await env.DB.prepare("SELECT MAX(id) AS id FROM identity_events WHERE kind = 'moderation'").first<{ id: number }>();
