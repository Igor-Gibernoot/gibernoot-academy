# info-geometry conventions by chapter

Everything fixed while building this course: notation, running examples, key numbers, per-lesson choices.
Read only the section you need: `grep -n '^## ' courses/info-geometry/CONVENTIONS.md`, then `sed -n` that range.

## General (rules fixed while building)


## Chapter 1

- Intro lesson `ch01-why`: outcomes $a,b,c$; $D_{KL}[p:q]=\sum_i p_i\ln(p_i/q_i)$ in nats (the source writes $\log$ = natural log); $\lVert p-q\rVert$ for the ruler distance.
- Running numbers: $p=(0.6,0.3,0.1)$, $q=(0.2,0.3,0.5)$: $D[p:q]=0.498$, $D[q:p]=0.585$; midpoint $m=(0.4,0.3,0.3)$. Pythagoras triple $p=(0.6,0.3,0.1)$, $q=(0.3,0.4,0.3)$, $r\approx(0.1912,0.6929,0.1160)$: $0.2197+0.2006=0.4203$.
- Two-outcome example $p=(\tfrac12,\tfrac12)$, $q=(\tfrac14,\tfrac34)$: $D[p:q]=0.144$, $D[q:p]=0.131$.
- `ch01-manifold`: subscripts as in the source: $\xi=(\xi_1,\dots,\xi_n)$, cartesian $\xi$ and polar $\zeta=(r,\theta)$ on the plane; Gaussians $(\mu,\sigma)$, $(\mu,\sigma^2)$, moments $(m_1,m_2)$ with $m_2=\mu^2+\sigma^2$; simplex $S_n$ over outcomes $0..n$, chart $\xi=(p_1,..,p_n)$, $p_0=1-\sum\xi_i$; open simplex ($p_i>0$). Numbers: $(\mu,\sigma)=(1,2)\to(1,4)\to(1,5)$; plane point $(3,4)\to(5,0.927)$.
