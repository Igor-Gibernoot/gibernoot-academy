# Audit state (science-faith-mind). Coordinator edits this file in place at the end of each session.

Per-agent rules: agent-rules.md. Web method: docs/WEB_SEARCH.md. Rank table: audit.md. Paste list: britannica-paste-list.md.

## Progress
- Ranks 1 to 124 done.
- Clean-row pass (audit.md rank 125+, course science-faith-mind only): done 125, 126, 127, 128, 129, 130, 135, 136, 139, 140, 144, 146, 149, 151, 155, 157, 158, 162, 163, 170, 171, 172, 178, 179, 180, 191, 192, 193, 194, 196, 214, 215, 216, 217, 218, 219, 226, 227, 266 (Tier 1 finished). Tier 2 done: 131, 132, 133, 137, 138, 141, 142, 143, 147, 148, 153, 154, 156, 159, 160, 161, 164, 165, 166, 167 (=ch15-challenge), 168, 173, 174, 175, 177 (VERIFIED line 227), 181, 182 (=ch15-map), 183, 184, 185, 188, 195, 197, 198, 199, 200, 201, 202, 203, 204, 206, 208, 220, 221, 222, 223, 224, 225, 229, 230, 231, 233, 234, 239, 240, 241, 243 (rank 142 is the VERIFIED line "ch20 level audit", not a lesson file). Skipped for now (Tier 3?): 134.
- Hits (lessons whose text changed) in the clean-row pass: 35 of 36 (ch23-knowledge alt text counted as a hit; rank 178 changed only VERIFIED, not counted; all of 192 to 219 above changed text).
- Current tier: 2 (Tier 1 grep re-run: empty). Tier 2 list: `grep "^| [0-9]* | science-faith-mind" docs/audit-temp/audit.md | awk -F'|' '$2+0>=125 && (($6~/quotes/)!=($6~/attributions/))'`, rank order, skip done ranks. Next: 244 ch23-traps, 245 ch23-intuition, 246 ch24-map ... (re-run the grep; skip done ranks). Note: audit.md "L" numbers can be off by 1 to 2 against VERIFIED.md; use grep -n on the lesson id.
- Session 2026-11-27 (eighth): 10 agents (225, 229, 230, 231, 233, 234, 239, 240, 241, 243), all committed and pushed (6f44c56, 9a650e4, 6045b61, c4741db, f63449f, baa01f4/4ce8a0e/d972d70, 3878d57, e29e447, 4ae49fa, 7093266); 234 was sent back once for snippet-only. Text changes in 225 (supplementary hypothesis "dominant early 1860s" softened in ch14 challenge and torah), 239 (Madhva 1238-1317 "by the usual dating"; Tilak Gita Rahasya 1915 read), 240 (Stevenson wording, challenge and map), 241 (Hanson sweep DONE: "essay dated 1998 on its page and 1996 at its end" in ch21 challenge-2, challenge, fermi, map, biosignatures, traps, CONVENTIONS), 243 (Philo dates softened, swept to ch22 map, hermeneutics, traps, ch15/world, CONVENTIONS); VERIFIED only in 229, 230, 231, 233, 234. Sweep (a) Hanson is closed; (b) fana and (c) "dare to know" still open. New NOT CONFIRMED: ch14-challenge supplementary dominance early 1860s beyond Wikipedia (cand biblicalstudies.org.uk pentateuchal-criticism-today_alexander.pdf); ch22-map Levi-Strauss own trickster wording (cand users.uoa.gr/~cdokou/MythLitMA/levi-strauss.pdf, jstor.org/stable/536768); ch10-machines Searle "Minds, Brains, and Programs" 1980 only from SEP/IEP Chinese Room lines. No Britannica pastes.
- Session 2026-11-27 (seventh): 10 agents (202, 203, 204, 206, 208, 220, 221, 222, 223, 224), all committed and pushed (9e62a35, 8eee6b5, 53583a1, f8e8fa3, 0f4fa09, fbe6398, f31ad2f, bd2e9d4, 8489662, c994ac3/e85d9a9). Text changes in 202 (ODNI wording, Hanson date wording), 204 (Mackie dates per ADB), 208 (Peirce diamond), 220 (Craig P1 quote, also in ch06/challenge and ch25/evolved-morality), 222 (Britannica line removed, Bradley conversion, "scientist friend", self-surrender wording), 223 (fana gloss in map); VERIFIED only in 203, 206, 221, 224. Open sweeps: (a) Hanson Great Filter is "1998" in ch21 fermi, map, challenge, challenge-2?, biosignatures and CONVENTIONS, but the essay is dated 1998 in its page header and 1996 in its byline (ch21-traps now says so): align in those units or one sweep; (b) fana gloss "awareness of anything other than God" (al-Sarraj, Wikipedia only) remains in ch12/mysticism.yaml (~51, 262) and ch16 sufism.yaml, map.yaml: soften like ch12-map ("in Sufi accounts, the fading of the self's own attributes, often described as losing awareness of all but God"); (c) "dare to know" remains in ch24 traps.yaml 324, map.yaml 110/113/117, humanism.yaml 101/111. No new NOT CONFIRMED beyond: ch08-process Process and Reality 1929 first-edition page (pp. 351, 348 are the corrected edition, read in SEP); ch07-evil-logical Plantinga's verbatim transworld depravity definition (paraphrased); ch21-traps Lewis Perelandra (soft) and Peters read via Nesteruk. No Britannica pastes.
- Session 2026-11-27 (sixth): 10 agents (183, 184, 185, 188, 195, 197, 198, 199, 200, 201), all committed and pushed (7aa5b70, 00d87d1, 7ba6df0, fb01a1b, 726bdf0, f5d31bc, 0b3b57e, 2d08dbb, 376d2c0/94c8b0f, 152c851). Text changes in 197 (homoousios/Nicaea wording, A Common Word signers, drafters) and 198 (Sivin quote removed, Whitehead wording, Royal Society option); others VERIFIED only. New NOT CONFIRMED: ch20-challenge-2 Terre et ciel title-page year (cand gallica.bnf.fr/ark:/12148/bpt6k627327); ch19-challenge Nature 318:419 published text (preprint read); ch17-traps Gita Rahasya page (wisdomlib 403). Closed: Whitehead Lowell 1925 (ch09-theology-of-science item). No Britannica pastes.
- Session 2026-11-27 (fifth): 10 agents (165, 166, 167, 168, 173, 174, 175, 177, 181, 182), all committed and pushed; 168, 173, 167 and 181 were sent back once for snippet-only/wikipedia-only claims. Text changes in 165, 166, 168, 173, 174, 175, 177, 181; none in 167 (Wikipedia-only support replaced by Goodacre and Catholic.com) and 182 (map). Open sweep: "dare to know" remains in ch24 traps.yaml (~324) and map.yaml as a motto gloss (Fordham renders Kant "Have courage to use your own reason!"); decide in the ch24 traps/map units.
- Session 2026-11-26 (fourth): 10 agents (143, 147, 148, 153, 154, 156, 159, 160, 161, 164), all committed and pushed. Text changes in 153, 154 (Beauvoir softened in absurd-proof, absurd, map; the open follow-up is closed), 159, 160, 161, 164; no text change in 143, 147, 148, 156.
- Session 2026-11-26 (third): 10 agents (226, 227, 266, then Tier 2: 131, 132, 133, 137, 138, 141, 142), all committed and pushed. Text changes in 227, 131, 133, 137, 138. Open follow-up for the ch24-absurd-proof unit (rank 154): the Beauvoir 'to will oneself free is to will others free' principle is not confirmed in SEP; ch24-traps was softened to a plain paraphrase ('so it cannot be won entirely alone'); ch24 absurd-proof.yaml (lines ~13, 208, 216), map.yaml and absurd.yaml still state the principle, so align them in that unit. 11 hits of 47 text-changing rows is not the metric here; keep the Tier 1 hit count above (35 of 36 plus 227 = 36 of 39).

## Tiers (finish one before the next; tell the user when a tier ends)
- Tier 1 FULL: clean rows rank 131+ with BOTH "quotes" and "attributions". List: `grep "^| [0-9]* | science-faith-mind" docs/audit-temp/audit.md | awk -F'|' '$2+0>=131 && $6~/quotes/ && $6~/attributions/'`, rank order, skip done ranks. Agent checks every quote, attribution, date and number (strength "read") or softens or removes it.
- Tier 2 LIGHT (about 60 rows, exactly one of quotes/attributions): check ONLY quotes and attributions. Skip a date that the VERIFIED.md line already lists as "read" for that exact date (re-check if snippet only, wikipedia only, unchecked, or not listed). Open only candidates: links for those items.
- Tier 3 QUICK (about 43 rows, neither): `grep -n "<lessonId>" courses/science-faith-mind/VERIFIED.md`; if the line has "snippet only" or "wikipedia only", audit just those items, else mark done with no agent (not counted in the cap).

## Coordinator rules
- Lean coordinator. One fresh agent per unit, strictly sequential, model sonnet, effort medium, MAX 10 agents per session, no new lessons.
- The agent prompt names the tier, the lesson id and file, what to check first, plus only that lesson's lines from "NOT CONFIRMED" below and any special rule below that applies. Do not paste this whole file.
- A unit is failed (resume the agent with SendMessage) if it leaves "unchecked", "snippet only" with no follow-up, "wikipedia only" on a claim in the lesson text, or "reused from another line". Candidates links must all be opened before NOT CONFIRMED.
- If WebFetch fails: retry once, then a mirror or another reference site.
- Sweep rule: when a date or wording changes, grep every course file (lessons, maps, challenges, CONVENTIONS) so they agree.
- Parallel sessions share the tree: stage by path, never `git add -A`, never anything under courses/classical-mechanics/. validate may show 2 unrelated errors about widget "ang-mom-area": ignore if science-faith-mind has none.
- Britannica pastes: only CRITICAL ones (Igor, 2026-11-26: optional links dropped). A line goes in britannica-paste-list.md only if the lesson cannot do without a claim that Britannica alone supports; otherwise soften or remove and leave in NOT CONFIRMED. None open now except the ch19-jain search note. If a unit adds one, give the user the link and the full rule-12 prompt with items a, b, c. Form: Link + "Use ONLY this page's text, nothing from memory. Quote the exact sentence or write NOT STATED. Keep dates as written. Start your reply with `<lesson id>, <page name>`." Apply each pasted answer to the lesson, VERIFIED.md and britannica-paste-list.md.
- End of audit: tell the user, then `git rm -r docs/audit-temp`, commit, push. Not before.
- Final message of every session: final report (fixed with commits, still NOT CONFIRMED, Britannica pastes) and the next-session prompt (see NEXT_PROMPT below, with the progress above updated). Update this file first and commit it by path.

## Special rules (give an agent only those that apply)
- ch17 Upanishad wording is aligned (ch17-brahman, ch17-challenge-2, ch20-comparison: "about 800 to 500 BCE depending on the reference work").
- ch14-archaeology (Tel Dan/Hazael, Anastasi V Succoth flag at line 72) or ch21-copernican: reconcile with ch14-traps and ch14-thought (de Leon "died 1305, late 13th century", Luria 1534 to 1572, Talmud burning "by Christian authorities", 1232 or 1233) and ch21-challenge (Gott, no "astrophysicist").
- ch16-map/muhammad/CONVENTIONS: Ibn Ishaq d. 767, some sources about 773. ch16-modern, ch09: Ibn al-Haytham Optics "some sources 1011-1021". Kardec/Brazil: Kardec first published 1857 wording, FEB 1 or 2 Jan.

## NOT CONFIRMED (carried over; retry only if a unit touches the lesson; "cand" = candidate source)
- ch12-mysticism: al-Sarraj 'awareness of anything other than God' (Wikipedia only, worded 'Sufi writers'); Katz title and pages (snippet only; read in SEP bibliography under ch12-perennial); Iranica fana (dropped from lesson).
- ch12-perennial: Ferrer on Advaita (dropped; cand Parsons review JAAR/Journal of Religion 2003 pp. 692-693); Chatto 1946 (lesson says 1945); Leibniz 1714 vs 1715 (lesson 'early 1700s'; cand Schmitt 1966 J. Hist. Ideas 505-532); Huxley 'reviewers noting bias' (Wikipedia only, 'according to critics'); Proudfoot coffee counter and Forman nirodha-samapatti (snippet only).
- ch12-traps: Paloutzian-Richardson-Rambo 1999 original abstract (cand onlinelibrary.wiley.com/doi/10.1111/1467-6494.00082, PsycNET).
- ch08-spinoza: Ip14 corollary (not in text); exact Ethics printing year; Einstein 1879-1955 (Nobel snippet).
- ch08-challenge: Pike 1965 paper text (cand jstor.org/stable/2183529); Maimonides Mishneh Torah wording (cand search 'Hilchot Avodah Zarah 9:4 Notzrim uncensored Hebrew').
- ch19-confucius: Anna Sun 2013 own wording; Zhu Weizheng beyond SEP (cand Loewe, Cambridge History of China vol. 1).
- ch23-fideism: Plantinga 1983 p. 87 full wording (dropped); Nielsen-Phillips 2005 SCM (snippet, not load-bearing).
- ch23-pragmatic: Hajek 2003 paper itself (cand philarchive.org/rec/HJEWWO, jstor 3595561); Pascal Pensees posthumous rests on SEP 1670.
- ch18-no-self-proof: Rhys Davids quotes (cand sacred-texts.com/bud/sbe35/sbe3504.htm); Siderits and Parfit attributions (secondary snippets); Schumann 2020 date.
- ch19-jain: Mallisena 1292 and Koller (snippet only, kept soft); cand PhilPapers Cort, jainqq Dundas.
- ch16-challenge (no claim remains): early commentators on dhimmi and abrogation readings; Ibn Taymiyya; Arnold 1913 (cand tafsir.learn-quran.co ayah-256; Tabari 2:256; Motahhari).
- ch22-analogy: Maimonides I.58 plurality claim; I.60 ship (CCEL summary only).
- ch08-panentheism: page-level wording of Clayton 2000 The Problem of God in Modern Thought (cand Eerdmans page; PhilPapers).
- ch23-traps, ch23-fundamentalism: still say "compliment" (traps.yaml lines ~275, 281, 346; fundamentalism card title); map says "neutral, inclusive name". Fix in those lessons' units.
- ch19-zoroaster: Barr p. 206 (cand JSTOR JAAR 53/2 1985, 201-235), Boyce p. 29. Grabbe's own view (no claim remains).
- ch19-shinto, ch19-challenge-2: Kuroda 1981 beyond Teeuwen and Scheid; 100,000 shrines as an official total; Picken "credenda vs agenda"; tokowaka term and Ise "17 years" (cand Daiwa Institute 2016, search 常若 伊勢神宮 式年遷宮); 20,000 unaffiliated shrines.
- ch19-esoteric/map: Ficino Pimander April 1463 and 1471 from a second page (cand cambridge.org Hermes and the Sibyl; tandfonline 10.1080/17496977.2019.1546439); Morgan Library dating of the Visconti-Sforza deck.
- ch19-challenge: Carlson Nature 318:419 own text (cand ui.adsabs.harvard.edu/abs/1985Natur.318..419C/abstract).
- ch14-rabbinic: Karaite "hubris" reading of Akhnai; Moses de Leon on PaRDeS.
- ch14-traps/thought: de Leon birth year; Zohar dating beyond Scholem via JVL; Amenemope and Atrahasis dates (Morgan, British Museum, Cambridge 403); Dever, Garstang, Kenyon exact years (kept as decades).
- ch14-thought: Ethics 1677 date; Luria's arrival in Safed (removed; cand britannica.com/print/article/351761, unfetchable); Major Trends chapters on Zohar and Luria (TOC snippet only, JSTOR blocked).
- ch23-fundamentalism: Gold's wording; Fundamentalism Project 1987 start.
- ch21-theology: founding place of the Raelian movement (NOT STATED anywhere); Kimball's book and page.
- ch19-movements: survey figure on the Book of Mormon (none exists; softened).
- ch22-challenge: Levi-Strauss trickster wording.
- ch15-paul: exact birth year, Galatians date, Philippi founding year (removed from text; no paste needed).
- ch10-iit: Tononi birth year (dropped); Nature and PubMed pages for Cogitate (walls; covered by Birmingham abstract). ch08-apophatic: Kellner not tied to the Kaplan passage. ch23-knowledge: Clifford 1877 month (lesson says 1877 only).
- ch24-skeptic/ch24-stoic/ch25-ethics/ch20-principles/ch23-evidentialism/ch22-metaphor: none carried (Tillich being-itself exception and Ramsey Oxford/Nolloth removed).
- ch08-attributes: Savage 1967, Euthyphro attribution. ch08 (line 49): Whitehead 1929 first-edition page.
- ch10-gwt: Baars, Rosenthal 1986, Block 1995 pages.
- ch17-karma: Madhva graded bliss, Bodewitz 1996, Advaita "non-doer". ch17-darshanas: Karika 21 verse number.
- ch18-schools: Lohapasada. ch06-reason: Anscombe, Balfour.
- ch18-buddha: Bechert 1988, Gombrich, Sautrantika nirvana, Bronkhorst critics.
- ch18-map: Britannica Milinda-panha date.
- ch18-traps: Batchelor birth year (cand penguinrandomhouse.com/books/9466/confession-of-a-buddhist-atheist-by-stephen-batchelor; publishersweekly.com/9781573220583); Lutz mean ages 49 and 21 (removed; cand pubmed.ncbi.nlm.nih.gov/15534199, pmc.ncbi.nlm.nih.gov/articles/PMC526201).
- ch18-zen: Daoist influence on Zen (Musacchio 2025 only).
- ch16-isnad: da'if definition, Schacht 1950 date, ICMA summary.
- ch16-challenge-2: exact 1095 date of al-Ghazali's Incoherence (cand ghazali.org/griffel/JIS-2006.pdf, binary; lesson keeps "about 1095").
- ch16-modern: Salam banquet speech wording (nobelprize.org/prizes/physics/1979/salam/speech/); Hameed 2015; Gutas on Greek translation reports.
- ch16-muhammad: Wansbrough 1928-2002; Ibn Sa'd birth 784; Abbasid 750; Cook's distancing (confirmed not stated).
- ch16-shared: Isaac/Ishmael majority claim (blog-only).
- ch16-law: Baqillani attribution via Lowry, Brill 2002; the Ali/Abu Bakr sentence.
- ch16-kalam: exact Ash'ari years 874 to 936.
- ch16-arabia: Hubal Nabataean inscription; Allah-only inscriptions; Himyar end date 525-530 (cand Robin "Martyrs of Najran" PDF at gw.uni-jena.de).
- ch16-sufism: Qarmatian charge and al-Muqtadir (cand iranicaonline.org/articles/hallaj-1); Qushayri on wool; Ibn Arabi on the guide and the law; Masnavi line count.
- ch16-traps: Azami's position; Schacht's own isnad stance; Ehrman on the crucifixion (cand journal.uinsgd.ac.id/index.php/Diroyah/article/view/47688, ehrmanblog.org/?p=12066); Goldziher quote (Wikipedia only).
- ch16-intuition: Ibn Mujahid d. 936 and the seven readings (removed).
- ch15-historical: Reimarus political aim (cand archive.org fragmentsfromrei00reim, earlychristianwritings.com/schweitzer/chapter2.html); Hooker 1972 article content; Dunn p. 339 and Sanders on baptism and crucifixion (cand unrv.com Historical Figure review); Horsley portrait (cand academic.oup.com/jcs 36/2/403); Ehrman 1999 book.
- ch15-reading: Wellhausen 1883 retitling to Prolegomena (cand die-bibel.de/stichwort/34720); Britannica's c. 254 for Origen.
- ch15-creeds: Arius birth c.250 vs c.256; Gregory of Nazianzus death 390 vs 391 (kept as ranges).
- ch15-challenge: "Farrer needs no Q" Wikipedia-only (no dates on card); Tacitus 115 vs 116 (written as range); Ehrman-site pages for the death date weaker.
- ch15-intuition: Irenaeus 3.11.8 passage snippet only (lesson says only "about 180, four Gospels").
- ch12-transformation: Griffiths 2006 paper text (https://pubmed.ncbi.nlm.nih.gov/16826400/); Paloutzian-Richardson-Rambo 1999 abstract.
- ch19-indigenous: Mbiti "graveyard of time" and "full spirit" wording (cand scielo.org.za/pdf/vee/v46n1/42.pdf (404), dc2.philarchive.org/rec/EKORJS (403)); Gyekye primary text.
- ch10-zombie: Frankish as illusionist beyond Wikipedia (cand plato.stanford.edu/entries/consciousness-illusionism/).
- ch19-sikh: Jat share beyond Jodhka's "almost one-third"; Gurus all Khatri; Kabir/Ravidas/Farid contributor count (cand mdpi.com/2077-1444/15/10/1219, pluralism.org/sikhism).
- ch21-ufo: Condon critics, Ruppelt coinage (Wikipedia only).
- ch17-schools: first user of rope-and-snake; the anirvacaniya reply.
- ch17-brahman: Doniger's reading, RV 10.97.11 as earliest use, Flood on brahman, Gaudapada as earliest Advaita text (all dropped).
- ch14-scrolls: Tov's five-group scheme and the 1992/2001 percentages.
- ch14-textual: Metzger's exception wording pp. 209-210; Westcott-Hort "weighed, not counted".
- ch14-challenge-2: Redford, Cline and Dever 2003 (cand Cline From Eden to Exile p. 74; Dever Who Were the Early Israelites p. 19).
- ch14-archaeology: line 72 says Anastasi V names Succoth, which cojs.org does not support (cand Bietak and Rendsburg 2021 pp. 38-39); Tel Dan/Hazael text says Hazael, BAS article names Ben-Hadad.
- ch22-myth: Mythologiques end date 1971 and volume count; 1955 essay date; short-units method; German 1957 edition (cand libcat.library.tamu.edu/Record/in00000237428/Versions, IUPress essay page).
- ch22-ritual: Bell birth and death years (cand relbib.de/Authority/085501743, scu.edu in-memoriam page); Staal mantras and Agnicayana link (cand repozytorium.amu.edu.pl PDF, Snodgrass PDF at asah.sydney.edu.au).
- exam-partial3: Britannica's 1704 for Tegh Bahadur (search result only); Meier pp. 168-171; Mbiti primary text.
- ch05-something: Leibniz's exact question and wording in section 7 (cand earlymoderntexts.com/assets/pdfs/leibniz1714b.pdf, philpapers.org/rec/LEIPON); Krauss birth year.
- ch10-hard-problem: Frankish page range 11-39 (not stated in lesson).
- ch11-extraordinary: Bem, Utts and Johnson reply, JPSP 101, 716-719, on the prior (UCSF PDF 403).
- ch20-kardec: 18 Apr 1857 as publication day and 1 Jan 1858 for the Revue Spirite (cand brooklynmuseum.org/objects/156349 (429 twice), Kardecpedia second-edition download (over size), bibliadocaminho Re58Mar.pdf (scan)).
- ch24-epicurean: Nagel "Death" Nous 1970 pp. 73-80 (snippet only; search "Nagel Death Nous 1970 vol 4 pp 73-80"); Mill Utilitarianism 1863 book date (cand Liberty Fund Mill page, Spectator 11 Apr 1863, BMCR 2008.08.12).
- ch05-beginning: Guth's own view on a beginning (NOVA page empty; no claim remains).
- ch17-dialogue: Carroll "electron is an excitation of the electron field" (cand symmetrymagazine.org/article/july-2013/real-talk-everything-is-made-of-fields, 403 twice); Van Dam full text (cand pmc.ncbi.nlm.nih.gov/articles/PMC5758421/, bot check); nobelprize.org 2011 press release (403, nature blog used).
- ch09-theology-of-science: Needham 1951 date and Guo 2024 preprint (philsci-archive blocked); Whitehead Lowell 1925 (Gutenberg 503); Hooykaas thesis; Royal Society founding-phrase wording (cand Sprat or Birch); Merton exact wording (cand Osiris on JSTOR).
- ch20-comparison: "neither the same nor another" (Milinda; cand dhammatalks mil3.2.1, connection refused); Leroux birth year and Encyclopedie nouvelle start (cand intellectualhistory.web.ox.ac.uk/node/3705266, gallica bpt6k627327 (403), halshs ArticleLeroux.pdf (denied)); Reynaud birth year (Revue Spirite obituary says 1808); Terre et ciel 1854 title-page year (Darling and Wikipedia only); Gospel renaming year (lesson gives none).

- Added 2026-11-26 (third): ch25-death: Čapek play premiere day 21 Nov 1922 (Wikipedia/snippet; not in lesson; cand novinky.cz Vinohrady article, digilib.phil.muni.cz/_flysystem/fedora/pdf/112383.pdf), Williams 1929-2003 (obituary search results only). ch12-numinous: 'many reports lack fearful awe' (now a critic's question). ch18-intuition: Rhys Davids 1890 chariot text; Lutz ages not stated. ch24-pragmatism: Russell original text (cand Hist. of Western Philosophy 1946 p. 772). ch09-origins-religion: Collins led the Human Genome Project (Wikipedia only; cand nature.com/articles/28478 for Larson-Witham). ch20-kardec: Revue Spirite 1 Jan 1858 day, 'two columns'. ch24-traps: exact Beauvoir phrase (see Progress).
- Added (fourth): ch23-pluralism: Küng "presumptuous" original page (cand On Being a Christian 1976 p. 98; MDPI 403). ch11-mediumship: 18 Apr day of the 1857 Livre des Esprits on a primary page (cand search "FEB Livro dos Espiritos edicao historica 1857", Revue Spirite Mar 1860). ch24-absurd-proof: exact Beauvoir phrase (no longer quoted). ch10-self: Dennett 1991 use of "center of narrative gravity" (cand faculty.uca.edu Dennett page). ch11-dreams-nde: Kurtz p. 349 and Ash-Gundlach-Sturm review (attributions dropped), Blanke 2002 full paper. ch09-traps: Cantor and Kenny 2001 full text (cand zygonjournal.org/article/id/13023), Polkinghorne wording, NAS 7.0% and "personal God" (nature.com/articles/28481.pdf). ch12-neuro-religion: Waxman-Geschwind dated 1974 in some sources, 1975 in others (read).
- Added (fifth): ch11-psychedelics: Mazatec velada (Wikipedia/snippet; cand wussu.com Wasson Life PDF), Hofmann 1938 "synthesized" (Britannica snippet; swissinfo says "discovered"), death 28 or 29 Apr 2008. ch15-resurrection: Davies and Allison on the guards, 1 Cor at Ephesus, Dunn p. 781 from the book. ch15-canon: Rothschild date, Bezae century (removed). ch15-today: Gutierrez verbatim definition (now paraphrase; cand Orbis Theology of Liberation intro), Medellin as origin, 14 vs 17 April Azusa. ch15-map: Reimarus political aim, Dunn 1982 Manson lecture. ch18-no-god: Wallace on rebirth (reviews only), Batchelor "agnostic" (tricycle only). ch10-free-will: Soon "up to 10 s" (cand nature.com/articles/nn.2112). ch24-humanism: none.
- Resolved: Nagel 'Death' Nous 1970 vol 4 no 1 pp. 73-80 now read (ch24-epicurean entry above is closed).

## NEXT_PROMPT (template; update only the progress line)
Continue the science-faith-mind source audit as coordinator. Read docs/audit-temp/STATE.md (progress, tiers, rules, NOT CONFIRMED) and follow it, plus docs/AUTONOMOUS.md and the repo CLAUDE.md. Sonnet agents at medium effort, max 10 per session, sequential. Progress so far: <fill: tier, done ranks, hits>. At the end: update STATE.md, commit it by path, give the final report and this prompt again with the updated progress line.
