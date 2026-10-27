# `dual-grids`
Two planes side by side, the $\xi$-plane and the $\xi^*$-plane with $\xi^*=\nabla\psi(\xi)$, for a convex potential $\psi(\xi_1,\xi_2)$ (`js/widgets/dual-grids.js`; svg + plain HTML).
One gold point lives in both and is draggable in either (the other follows). Lines $\xi_i=$ const (purple) are straight in the $\xi$-plane; in the $\xi^*$-plane they stay straight but unevenly spaced for a separable $\psi$ and are bent for `softmax`; lines $\xi^*_j=$ const (orange) the other way round; the two lines through the point are thick. Basis arrows at the point: $e_i=\partial/\partial\xi_i$ (purple) and the dual basis
$e^{*j}=\partial/\partial\xi^*_j$ (orange), each the true tangent vector (one common length factor per plane). General tool, no course text.
Config: `psi: quad|negentropy|neglog|coupled` or an array `[psi1, psi2]` (separable $\psi=\psi_1(\xi_1)+\psi_2(\xi_2)$ with $\tfrac12\xi^2$, $\xi\ln\xi-\xi$, $-\ln\xi$; logs on $\xi>0$, drag clamped at 0.08 / 0.2);
`softmax` = $\ln(1+e^{\xi_1}+e^{\xi_2})$ (bent grids; $\xi^*$ in the triangle $\xi^*_1+\xi^*_2<1$, $G=\mathrm{diag}(q)-qq^{\mathsf T}$);
`coupled` = $\tfrac12\xi^{\mathsf T}A\xi$ with `A` (default `[[2,1],[1,1]]`, so $G=A$ has off-diagonal terms); `x: [x1,x2]`, `fixed`; `grid: both|xi|dual|false`, `gridStep: [s_xi, s_xi*]`;
`basis: false|primal|dual|both`; `readout: false|true|[point, G, Gstar, product, inner]` (false = picture only; $G=\nabla^2\psi$ analytic, $G^*=\nabla^2\psi^*$ by differentiating the inverse map,
then the product $GG^*$ and $\langle e_i,e^{*j}\rangle=e_i^{\mathsf T}Ge^{*j}$ come out as $I$ by computation); `panels: both|xi|dual`; `xRange`, `dualRange` ($[[a,b],[a,b]]$);
`presets: [{label, x}]`, `reset`; `labels: {xi, xis, psi, reset}` (TeX). `el.dataset`: `x1`, `x2`, `s1`, `s2`, `g11`, `g12`, `g22`.
Presets (copy into the lesson):
- `grids`: `{psi: [negentropy, negentropy], grid: both, x: [1.5, 2]}` (picture only: rectangular grids, evenly spaced in one plane and crowded in the other; separable $\psi$ never bends lines, for that use `softmax`).
- `dual-basis`: `{psi: [negentropy, negentropy], grid: both, basis: both, x: [1.5, 2]}` (the two bases at the point; no numbers).
- `metric`: `{psi: [negentropy, neglog], grid: xi, basis: primal, readout: [point, G, Gstar, product, inner], x: [1.5, 1.5]}` (metric as Hessian, diagonal, changes with the point).
- `coupled`: `{psi: coupled, A: [[2, 1], [1, 1]], grid: both, basis: both, readout: [G, Gstar, product], x: [0.6, 0.4]}` (constant off-diagonal $G$; both planes are linear images, grids straight but skew).
- `bent`: `{psi: softmax, grid: both, basis: both, x: [0.3, -0.5]}` (curved grids: each family is straight in its own plane and bent in the other).
