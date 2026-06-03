# How to push this asset pack to GitHub

Extract this archive into the root of `Dayzcoub/hamster-run`.

Expected result:

```text
hamster-run/
  assets/
    manifest.json
    sprites/
      characters/
      collectibles/
      obstacles/
```

Then run:

```bash
git add assets
git commit -m "assets: add v0.1 hamster and object sprites"
git push
```

## iPhone note

GitHub web/mobile cannot unpack a ZIP directly into a repository folder. On iPhone this normally requires a Git client app such as Working Copy, or GitHub Codespaces from Safari.
