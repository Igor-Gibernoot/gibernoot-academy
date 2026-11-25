# classical-mechanics conventions by chapter

Notation, running examples and key numbers fixed while building. Read only the section you need: `grep -n '^## '`, then `sed -n` that range.

## General

- One notation for the whole course; where Taylor and Goldstein differ, Goldstein's symbol ($L$, $H$, $V$, $q_j$, $p_j$), named once against the other book's. To confirm against the sources.
- **Polar angle in the plane: $\varphi$** (Taylor's symbol; $\theta$ is already the slope angle of Level 2 and the spherical polar angle later), $\hat{\mathbf{r}}$, $\hat{\boldsymbol{\varphi}}$ as unit vectors. Used in Levels 2-13. At Level 14+ say once that Goldstein writes $\theta$ for it. Exception to the Goldstein-first rule, chosen because Taylor is the main source for Levels 1-13.
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
- Inertia: $\mathbf{F}=m\mathbf{a}$, $\mathbf{F}=\dot{\mathbf{p}}$; frame $S'$ with origin $\mathbf{R}(t)$ in inertial $S$: $\mathbf{a}'=\mathbf{a}-\ddot{\mathbf{R}}$; braking cart $\ddot R=-2$ m/s$^2$; Earth equator rotation $0.034$ m/s$^2$ (0.35% of $g$), orbit $0.006$ m/s$^2$; sliding $d=v_0^2/(2g\mu)$, $v_0=10$ m/s: 7.3 m ($\mu=0.7$), 51 m (0.1), 255 m (0.02).
- Third law: $\mathbf{F}_{\alpha\beta}$ = force on $\alpha$ by $\beta$, $\mathbf{F}_{12} = -\mathbf{F}_{21}$ (different bodies); $\mathbf{P} = \sum\mathbf{p}_\alpha$, $\dot{\mathbf{P}} = \mathbf{F}^{\text{ext}}$; rifle 4 kg, bullet 0.02 kg at 600 m/s, recoil 3 m/s; $F_{\text{mag}}/F_{\text{Coul}} \sim v^2/c^2$.
- Block on an incline (Taylor 1.6): origin at the release point, $x$ down the slope, $y$ normal (away from the slope), $z$ across; angle $\theta$, $\mathbf{w}=m\mathbf{g}$, $N = mg\cos\theta$, $f=\mu_k N$ sliding, static $f\le\mu_s N$ (equals $mg\sin\theta$ at rest), $\ddot x = g(\sin\theta-\mu_k\cos\theta)$, slides iff $\tan\theta>\mu_s$. Numbers: 2 kg, 30 deg, $\mu_k=0.2$: $f=3.39$ N, $\ddot x=3.20$, $x(2)=6.4$ m; $\arctan0.5=26.57^\circ$.
- Polar (Taylor 1.7): $x=r\cos\varphi$, $y=r\sin\varphi$; $\mathbf{r}=r\hat{\mathbf{r}}$; $d\hat{\mathbf{r}}/dt=\dot\varphi\hat{\boldsymbol{\varphi}}$, $d\hat{\boldsymbol{\varphi}}/dt=-\dot\varphi\hat{\mathbf{r}}$; $\mathbf{v}=\dot r\hat{\mathbf{r}}+r\dot\varphi\hat{\boldsymbol{\varphi}}$; $a_r=\ddot r-r\dot\varphi^2$, $a_\varphi=r\ddot\varphi+2\dot r\dot\varphi$ (Coriolis term $2\dot r\dot\varphi$, named, treated in the rotating-frames level); $\omega=\dot\varphi$. Numbers: stone $0.2$ kg, $r=0.5$ m, $\dot\varphi=4$ rad/s: $a_r=-8$, $T=1.6$ N ($6.4$ N at 8 rad/s); $r=2$, $\dot\varphi=1.5$: $a_r=-4.5$.
- Polar proof: $\hat{\mathbf r}=\cos\varphi\,\hat{\mathbf x}+\sin\varphi\,\hat{\mathbf y}$, $\hat{\boldsymbol\varphi}=-\sin\varphi\,\hat{\mathbf x}+\cos\varphi\,\hat{\mathbf y}$; $a_\varphi=\frac1r\frac{d}{dt}(r^2\dot\varphi)$; free line $x=2$ m, $\dot y=3$ m/s: at $y=0$ $\ddot r=4.5$, $\dot\varphi=1.5$, $a_r=0$; circle $r=0.25$ m, $\dot\varphi=6$: $a_r=-9$.
- Challenge part 1: cart R-ddot = 1.5 m/s^2, crate 2 kg, mu_s 0.4 (limit 3.92 m/s^2), mu_k 0.3 at R-ddot = 5 gives a' = -2.06; skaters 40 and 60 kg, J = 120 N s over 0.5 s (240 N), rope 20 N for 2 s gives P = 40; bead 0.1 kg on r = 0.5 + t, phi = 2t, F = (-0.6, 0.4) N at t = 1.
