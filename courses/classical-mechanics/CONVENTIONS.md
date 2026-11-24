# classical-mechanics conventions by chapter

Notation, running examples and key numbers fixed while building. Read only the section you need: `grep -n '^## '`, then `sed -n` that range.

## General

- One notation for the whole course; where Taylor and Goldstein differ, Goldstein's symbol ($L$, $H$, $V$, $q_j$, $p_j$), named once against the other book's. To confirm against the sources.
- SI units; $g = 9.8\ \mathrm{m/s^2}$ unless a lesson says otherwise.

## Chapter 1
- Pendulum phase portrait (widget `phase-portrait`): $E = p^2/2 + 1 - \cos q$, $q$ = angle from hanging down, bottom $E = 0$, separatrix $E = 2$, units $m = l = g = 1$.

- Moon: $r = 3.84\times10^8$ m, $T = 2.36\times10^6$ s, $a = 4\pi^2 r/T^2 = 2.72\times10^{-3}$ m/s$^2$ = $g(R/r)^2$ at $r = 60R$; Earth $R = 6371$ km, $v_c \approx 7.9$ km/s.
- $\mathbf{v} = \dot{\mathbf{r}}$, $\mathbf{a} = \ddot{\mathbf{r}}$, $\mathbf{F} = m\ddot{\mathbf{r}}$; the state = position and velocity at one instant; time step $\Delta t$.
- Action $S = \int_{t_1}^{t_2} L\,dt$, $L = T - V$ (Goldstein writes $I$ in 2.1; the course uses $S$); kinetic $T = \tfrac12 m\dot y^2$, potential $V = mgy$, $g = 10$ m/s$^2$ in the intro toy numbers. Intro examples: thrown ball $m = 1$ kg ground to ground in 2 s (peak 5 m, $S = -33.3$ J s); free ball 2 m in 2 s ($S = 1$ vs 2); lifeguard 5 and 1.5 m/s (entry 52 m vs 30 m). Hamilton's principle is stationary, not least (spring $k = 1$, 4 s).
- Challenge: lifeguard A (0,12) m, B (20,-8) m, 5 and 1.5 m/s, best crossing 17.94 m (9.82 s); kicked pendulum p = 1.6, E = 1.28.
- Phase space intro: $q$ position, $p$ momentum (here $p = \dot q$, $m = 1$); periods of the pendulum: 6.35 ($q_0 = 0.4$), 7.30 (1.5), 16.16 (3), spinner $p = 3$ gives 2.41; spring $2\pi$; separatrix $E = 2$.
- Challenge part 2: thrown ball m = 1 kg, g = 10, ground to ground in 3 s, family y = a t(3-t), S(a) = 4.5 a^2 - 45 a, real peak 11.25 m (S = -112.5); hill V = -q^2/2, $\ddot q = q$, q = q0 cosh t, from q0 = 0.1 reaches q = 2 at t = 3.69, from 0.001 at 8.29; E = 0 lines are the hill's separatrices.

## Chapter 2
- Frames $S$ (platform, bank) and $S'$ (train, water), constant relative velocity $\mathbf{u}$, $\mathbf{r} = \mathbf{r}' + \mathbf{u}t$, $\mathbf{v} = \mathbf{v}' + \mathbf{u}$, $\mathbf{a} = \mathbf{a}'$. Train 20 m/s, ball 3 m/s, wall 6 m; river 4 m/s, boat 3 m/s (speed 5).
- Taylor notation: $\hat{\mathbf{x}},\hat{\mathbf{y}},\hat{\mathbf{z}}$ or $\mathbf{e}_i$, components $r_i$; torque $\boldsymbol{\Gamma} = \mathbf{r}\times\mathbf{F}$. Thrown ball $x = 4t$, $y = 10t - 5t^2$ (g = 10 for round numbers).
