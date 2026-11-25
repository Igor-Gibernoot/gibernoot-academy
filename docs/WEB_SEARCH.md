# Web search protocol (all courses)

Applies whenever any agent or session checks a fact by web (courses with a
"Web check is mandatory" rule, image captions, history or physics constants,
any external fact). A failed search usually means a bad query, not a missing
fact (the Einstein 1930 essay was once "not found" though a plain search finds
it at once). **A fact is "unconfirmed" only after every step below fails.**
**This applies to every course, not only those with a "Web check is
mandatory" rule:** an external fact (dates, names, attributions, places,
quotations, constants) is never written from memory. Check it here, or drop it
from the lesson text. An unconfirmed fact never ships and never stays as an
"open doubt".

1. **Short queries first**: 2 to 4 words, the way a person would google it
   (`Einstein Religion and Science 1930`, not a long sentence with quotation
   marks, dates and the claim). Add one distinguishing word at a time (author,
   title, year, "full text").
2. **Vary at least 3 times**: other word order, the original-language title,
   the author's name alone, the idea instead of the exact phrase, a quotation
   fragment of 4 to 6 words in quotes. Send independent queries in the same
   turn; use `mode: "extended"` on the retry.
3. **Go to the primary or reference site**, not only search results:
   SEP/IEP/Britannica (WebFetch the page and ask for the item), Wikisource,
   Project Gutenberg, sacred-texts.com, Fordham sourcebooks, archive.org,
   arXiv, NIST/PDG/CODATA for constants, publisher or journal pages. A PDF or
   full text is fetched with WebFetch and the exact sentence read there.
4. **Quotations**: confirmed only when the sentence is read in a full text
   (not a quote aggregator). If only secondary pages repeat it, paraphrase
   ("in essence") and log `secondary only`.
5. **Sources that disagree** (a birth year, a constant): give the commonly
   cited value and say "some sources give X", or use "c."; never silently pick. Prefer a range with attribution in the
   lesson text ("dated 1981 in some sources, 1983 in the journal volume";
   "1876 or 1877 in different sources"), log both sources in `VERIFIED.md`,
   and sweep every file of the course that states the date or number.
6. **Record the attempts**: each item left unconfirmed gets
   `tried: <q1>; <q2>; <site>` in the course's `VERIFIED.md`, so a later pass
   does not repeat them.
7. **A blocked page (403) is not a failed search**: try a mirror, a reprint or
   another site.
8. **Never guess URL slugs**: search for the URL first, then fetch it.
   Britannica returns 403 to the fetcher (bot block): use SEP, IEP, Jewish
   Virtual Library, Jewish Encyclopedia, Access to Insight, newadvent.org,
   vatican.va, wisdomlib or Warren's Buddhism in Translations instead.
9. **What counts as confirmed (strength of support).** Mark every checked item
   in `VERIFIED.md` with its strength:
   - `read`: the sentence or number was read on a primary or reference page
     (full text, PDF, SEP/IEP, publisher, archive, museum, society or
     university page). Only this supports a quotation, an exact date, a title
     with pages, or a "scholars say / X argues" claim.
   - `snippet only`: only a search-result summary showed it. Keep the claim
     soft ("about", "reported") or open the page before the lesson states it
     as fact.
   - `wikipedia only`: Wikipedia is the only support. Find a second source,
     or soften, or mark NOT CONFIRMED.
10. **Alternative sources and candidate links.** Before an item is marked
    NOT CONFIRMED, list at least three other places that could hold it and try
    each: a different reference work (SEP, IEP, Jewish Virtual Library, New
    Advent, Wisdomlib, Access to Insight), a primary text (Wikisource,
    Gutenberg, archive.org, Fordham), an institution (university, society,
    museum, journal, court, agency), an obituary or memorial notice for
    people's dates, Wikipedia's own citations for the page (follow them to the
    original), a Google Scholar or PhilPapers entry for authors and titles.
    Log them in `tried:`. For anything left open, write in `VERIFIED.md`
    `candidates: <url or search phrase>; <url or search phrase>` so a later
    pass or the user can check it quickly. Britannica-only items go to the
    paste list with the search phrase to find the entry.
11. **Try every candidate link.** A `candidates:` link is a to-do, not a
    note. When you have one, open it (WebFetch, or search for it by title and
    open the hit) before writing "NOT CONFIRMED", in a new lesson and in a
    review of an old one. Only a link that fails (403, 404, paywall, no
    matching text) may stay in `candidates:`, with the failure in `tried:`.
    Never leave a reachable link unopened. When a lesson is rechecked, first
    try every `candidates:` link already in its `VERIFIED.md` line.
12. **Blocked sites: ask Igor with a link and a prompt.** Britannica, Oxford
    Islamic Studies, sacred-texts and studylight cannot be fetched. When a
    lesson needs a fact that only such a site can give, and the fact really
    adds to the learning (a date, name or claim the lesson states), do not
    leave it unchecked: give Igor, for each page, two things in this form.
    - **Link**: the real URL if you have one from a search or a file, else a
      search phrase ("search Britannica Saint Jerome"). Never guess a slug.
    - **Prompt** he pastes into his browser AI: "Use ONLY this page's text,
      nothing from memory. Quote the exact sentence or write NOT STATED. Keep
      dates as written. Start your reply with `<lesson id>, <page name>`."
      then the numbered items (a), (b), (c) the lesson needs.
    If the fact does not add to the learning, drop it from the lesson instead
    of asking. A pasted reply that quotes the sentence is logged as `read
    (pasted by Igor)`; NOT STATED stays NOT CONFIRMED and the lesson is
    softened or the claim removed. Watch for replies that mix in another
    article loaded on the same page or an AI "Top Questions" box: prefer the
    article text.
