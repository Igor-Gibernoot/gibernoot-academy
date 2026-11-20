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
- Phase space intro: $q$ position, $p$ momentum (here $p = \dot q$, $m = 1$); periods of the pendulum: 6.35 ($q_0 = 0.4$), 7.30 (1.5), 16.16 (3), spinner $p = 3$ gives 2.41; spring $2\pi$; separatrix $E = 2$.
