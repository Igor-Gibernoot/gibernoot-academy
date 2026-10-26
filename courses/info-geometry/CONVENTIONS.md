# info-geometry conventions by chapter

Everything fixed while building this course: notation, running examples, key numbers, per-lesson choices.
Read only the section you need: `grep -n '^## ' courses/info-geometry/CONVENTIONS.md`, then `sed -n` that range.

## General (rules fixed while building)


## Chapter 1

- Intro lesson `ch01-why`: outcomes $a,b,c$; $D_{KL}[p:q]=\sum_i p_i\ln(p_i/q_i)$ in nats (the source writes $\log$ = natural log); $\lVert p-q\rVert$ for the ruler distance.
- Running numbers: $p=(0.6,0.3,0.1)$, $q=(0.2,0.3,0.5)$: $D[p:q]=0.498$, $D[q:p]=0.585$; midpoint $m=(0.4,0.3,0.3)$. Pythagoras triple $p=(0.6,0.3,0.1)$, $q=(0.3,0.4,0.3)$, $r\approx(0.1912,0.6929,0.1160)$: $0.2197+0.2006=0.4203$.
- Two-outcome example $p=(\tfrac12,\tfrac12)$, $q=(\tfrac14,\tfrac34)$: $D[p:q]=0.144$, $D[q:p]=0.131$.
- `ch01-manifold`: subscripts as in the source: $\xi=(\xi_1,\dots,\xi_n)$, cartesian $\xi$ and polar $\zeta=(r,\theta)$ on the plane; Gaussians $(\mu,\sigma)$, $(\mu,\sigma^2)$, moments $(m_1,m_2)$ with $m_2=\mu^2+\sigma^2$; simplex $S_n$ over outcomes $0..n$, chart $\xi=(p_1,..,p_n)$, $p_0=1-\sum\xi_i$; open simplex ($p_i>0$). Numbers: $(\mu,\sigma)=(1,2)\to(1,4)\to(1,5)$; plane point $(3,4)\to(5,0.927)$.
- `ch01-divergence`: divergence criteria (1) $D\ge0$, (2) $D=0\iff P=Q$, (3) $D[\xi_P:\xi_P+d\xi]=\tfrac12\sum g_{ij}d\xi_id\xi_j+O(|d\xi|^3)$, $\mathbf G$ positive-definite; $ds^2=2D$; $D_S=\tfrac12(D[P:Q]+D[Q:P])$. Numbers: $p=(0.8,0.2),q=(0.5,0.5)$: $0.193$ / $0.223$; $p=(.5,.5)$ to $(.99,.01)$: $1.614$ vs $0.637$; $(.5,.5)\to(.6,.4)$: $0.0204$ ($0.0201$ reversed), $(.55,.45)$: $0.0050$; $D_S=0.1373$ for $(\tfrac12,\tfrac12),(\tfrac14,\tfrac34)$; KL metric $g=4$ at $(\tfrac12,\tfrac12)$.

- `ch01-bregman`: $D[\xi:\xi_0]=\psi(\xi)-\psi(\xi_0)-\nabla\psi(\xi_0)\cdot(\xi-\xi_0)$, base point $\xi_0$ (book primes it: $\xi'$); chord point $\xi_\lambda=\lambda\xi_1+(1-\lambda)\xi_2$; $\psi=\xi\ln\xi-\xi$ used for the book's $\varphi=\sum\xi_i\log\xi_i$ (same $D$, linear term drops). Numbers: $\psi=\tfrac12\xi^2$, $D[3:1]=2$; $\psi=\xi\ln\xi-\xi$: $D[3:1]=1.296$, $D[1:3]=0.901$; $\psi=-\ln\xi$: $D[2:1]=0.307$, $D[1:2]=0.193$.
- `ch01-legendre`: dual coordinate $\xi^*=\nabla\psi(\xi)$ (the book's star, not $\eta$ yet), $\psi^*(\xi^*)=\xi\cdot\xi^*-\psi(\xi)=\max_{\xi'}\{\xi'\cdot\xi^*-\psi(\xi')\}$; $D_\psi[P:Q]=\psi(\xi_P)+\psi^*(\xi^*_Q)-\xi_P\cdot\xi^*_Q$. $\psi=\xi\ln\xi-\xi$: $\xi^*=\ln\xi$, $\psi^*=e^{\xi^*}$; $\xi=4\to\xi^*=1.386$; tangent at $\xi_0=2$ crosses axis at $-2$; $D_\psi[3:1]=1.296$.
- `ch01-dually-flat`: components $\xi^i$ (up), dual $\xi^*_i$ (down); $A=A^ie_i=A_ie^{*i}$, $A_i=g_{ij}A^j$, $A^j=g^{*ji}A_i$; $g_{ij}=\partial_i\partial_j\psi=\langle e_i,e_j\rangle$, $\mathbf G^*=\mathbf G^{-1}$, $\langle e_i,e^{*j}\rangle=\delta_i^j$, $ds^2=2D=g_{ij}d\xi^id\xi^j$; geodesic $\xi(t)=at+b$, dual geodesic $\xi^*(t)=at+b$. Numbers: negentropy $g_{ii}=1/\xi^i$; geodesic $(1,1)+t(1,2)$ maps to $\xi^*=(0,0),(0.693,1.099),(1.099,1.609)$; $\xi=(2,4)$, $A^i=(3,2)$: $|A|^2=5.5$, at $(3,6)$: $3.667$; $d\xi=(0.1,0.2)$: $ds^2=0.015$.
