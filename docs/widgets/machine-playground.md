# `machine-playground`
A tensor as a machine with slots: the reader drags the input vector(s) and
watches the output number. Buttons: **Reset**, **Double 𝒳**, and with two
slots **Double both**, plus the presets.
```yaml
config:
  slots: 1                    # 1: a covector eats 𝒳. 2: a (0,2)-tensor eats 𝒳 and 𝒴
  covector: [1, 0.5]          # slots 1: X(𝒳) = 1 x^1 + 0.5 x^2, drawn as level lines
  name: L                     # slots 1: the covector's letter (sans-serif), default X;
                              # slots 2: the tensor's letter, default T
  tensor: [[0, 1], [-1, 0]]   # slots 2: components T_ij, row i = first slot
                              # (the default [[0,1],[-1,0]] is the signed area)
  area: true                  # slots 2: shade the parallelogram spanned by 𝒳 and 𝒴
  partial: true               # slots 2: draw T(𝒳, ·) as level lines and show its
                              # components (fill one slot, get a covector)
  u: [2, 1]                   # initial 𝒳
  v: [0, 2]                   # initial 𝒴 (slots 2)
  snap: 0.5
  presets: [{ label: Along a line, u: [1, 2] }]   # u, v optional: keep the current inputs
                              # slots 2: a preset may also set tensor: [[..],[..]]
                              # (Reset restores the configured tensor)
```
The readout shows the inputs, the formula of a covector and its evaluation
$\mathsf{X}(\mathcal{X}) = \dots$ (slots 1), or $T(\mathcal{X}, \mathcal{Y})$
(slots 2).
