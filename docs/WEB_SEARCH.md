# Web search protocol (all courses)

Applies whenever any agent or session checks a fact by web (courses with a
"Web check is mandatory" rule, image captions, history or physics constants,
any external fact). A failed search usually means a bad query, not a missing
fact (the Einstein 1930 essay was once "not found" though a plain search finds
it at once). **A fact is "unconfirmed" only after every step below fails.**

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
   cited value and say "some sources give X", or use "c."; never silently pick.
6. **Record the attempts**: each item left unconfirmed gets
   `tried: <q1>; <q2>; <site>` in the course's `VERIFIED.md`, so a later pass
   does not repeat them.
7. **A blocked page (403) is not a failed search**: try a mirror, a reprint or
   another site.
