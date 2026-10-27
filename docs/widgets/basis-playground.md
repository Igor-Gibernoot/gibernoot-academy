# `basis-playground`
A fixed vector $\mathcal{X}$ (and optionally a covector, drawn as its level
lines) in the plane. The reader drags the new basis $\hat{y}_1, \hat{y}_2$;
the components $y^i$, the covector components $\mathtt{y}_i$ and their pairing
update live. Parallel basis vectors trigger a "not a basis" warning.
```yaml
config:
  vector: [3, 2]              # 𝒳 in the old basis
  covector: [1, 0.5]          # optional: covector components in the old dual basis
  dual: 1                     # optional, 1 or 2: draw the level lines of the dual
                              # basis covector ŷ^k and show it in the old dual basis
  basis: [[1, 0], [0, 1]]     # initial ŷ1, ŷ2
  snap: 0.5
  presets: [{ label: Shear, basis: [[1, 0], [1, 1]] }]
```
