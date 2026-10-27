# `map-builder`
Two finite sets, the domain $\mathcal{M}$ on the left and the target
$\mathcal{N}$ on the right, with one arrow per domain element. Tapping a domain
element moves its arrow to the next target element; the readout says whether
the map is injective, surjective and bijective (and lists $\phi^{-1}$ when it
exists), with the reason.
```yaml
config:
  domain: ['a', 'b', 'c']
  target: ['1', '2', '3']
  map: [0, 0, 1]              # index in target of each domain element's image
  presets: [{ label: '3 → 4', domain: ['a','b','c'], target: ['1','2','3','4'] }]
                              # a preset's map is optional (all to the first element)
```
