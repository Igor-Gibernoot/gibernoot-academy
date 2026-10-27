# `sphere`
The final-exam figures: the unit sphere $\mathcal{M}$, $\Phi(\alpha_1,\alpha_2)=(\sin\alpha_1\cos\alpha_2,\sin\alpha_1\sin\alpha_2,\cos\alpha_1)$,
with the angle chart $(\alpha_1,\alpha_2)$ and the projection chart $(\beta_1,\beta_2)$ on the northern
hemisphere (`js/widgets/sphere.js`, canvas, no library, theme-aware; reuses the palette, frame and text helpers
exported by `js/widgets/torus.js`, and the `tor-*` CSS). **Display only**: no component values, no labelled
answers. A rotatable 3D sphere (hidden lines dashed; drag, touch rotates horizontally only, arrow keys,
buttons Reset view / From above / From the side) plus chart panels below. Config: `view` (one name, or
a list shown as tab buttons; `labels: {view: text}` renames tabs), `rotate: false`, `az`, `el`
(first camera angles), and per view `alpha0` (`curves`, default $\pi/4$), `alpha1bar` (`geodesics`,
default $\pi/4$), `densities` (`region`, default false).
Views: `domain` (Fig. 1: grid, meridians blue, parallels orange, removed half meridian and poles green,
$\mathcal{V}$ tinted with dashed equator, axes $a,b,c$; panels $\mathscr{X}(\mathcal{U})$ with
$\mathscr{X}(\mathcal{U}\cap\mathcal{V})$ tinted, and the unit disk with the green cut); `curves` (Fig. 2:
$\gamma$ blue and $\delta$ orange with ticks at $\lambda=0.1..0.9$ and $k\pi/20$ on two slightly separated
copies of the meridian $\alpha_2=0$, $\sigma$ purple; panels disk and $\mathscr{X}$ up to $\pi/2$);
`geodesics` (Fig. 3: green meridians and equator, purple dashed parallel, $\gamma$/$\delta$ ticks; panel
$\mathscr{X}$); `region` (Fig. 4: $\mathcal{D}=\{a>0,\ 1/2<c<\sqrt3/2\}$ tinted; panels the rectangle
$(\pi/6,\pi/3)\times(-\pi/2,\pi/2)$ and the half annulus $1/4<\beta_1^2+\beta_2^2<3/4$, $\beta_1>0$).
`densities: true` on `region` adds the two density curves with shaded ranges ($\sin\alpha_1$ over the
chart $\mathscr{X}$, $1/\sqrt{1-\beta_1^2}$ along $\beta_2=0$ with the $\beta_1=1$ asymptote) and the tick
labels $\pi/6$, $\pi/3$, $\pm\pi/2$ of the rectangle; default false, because the curves and those
bounds answer a question. $\gamma$ sits at $\alpha_2=+0.07$ and $\delta$ at $-0.07$ (chart panels: $\beta_2=\pm0.07$,
$\alpha_2=\pm0.45$ or $\pm0.3$), only for readability.

**Figure on any card:** `figure: { widget: torus | sphere, config: {...} }` shows a widget above the
prompt (below the body on text cards); used by exam cards.
