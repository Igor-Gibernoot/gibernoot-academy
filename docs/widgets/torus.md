# `torus`
The exam figures: the torus $\mathcal{M}$ with the angle chart $(\theta,\varphi)$ and the
projection chart $(a,b)$ (`js/widgets/torus.js`, canvas, no library, theme-aware). **Display only**:
no component values, no labelled results. A rotatable 3D torus (drag; touch rotates
horizontally only, so the page scrolls; arrow keys; buttons Reset view / From above / From the side)
plus chart panels below it. Config: `view` (one name, or a list shown as tab buttons;
`labels: {view: text}` renames tabs), `rotate: false`, `az`, `el` (first camera angles).
Views: `domain` (Fig. 1: grid, green cuts $\theta=\pi$, $\varphi=\pi$, $p_0$); `transition`
(Fig. 2: $\mathcal{V}$ tinted, equators dashed, panels $\mathscr{Y}$ and $\mathscr{X}$ with the
images of $\mathcal{U}\cap\mathcal{V}$ and the grid); `curves` (Fig. 3: $\gamma$ blue, $\delta$ purple,
direction-only velocity arrows at $p_0$); `scalar` (Fig. 4: $f=a$ colour and level sets, tangent
plane, stack of level lines of $(df)_{p_0}$, $\gamma$ and $\delta$); `fields` (Fig. 5: normalized
$\partial_\theta$ blue and $\partial_\varphi$ purple on the torus and in both charts); `actions`
(Fig. 6, four colour maps of $\mathcal{X}\lfloor f\rceil$ in $\mathscr{X}$ and $\mathscr{Y}$,
$(\mathcal{X}\oplus_\Gamma\mathcal{Y})\lfloor f\rceil$, $\mathcal{Y}\lfloor f\rceil$; this one shows the
answer of Question 4(b,c) qualitatively, as the paper exam did).
