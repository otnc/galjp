## Summary

<!-- Select which applies to your request type. -->

- [ ] Fix bug(s)
- [ ] New feature(s)
- [ ] Conversion data (component styles, overrides, variants)
- [ ] Others

<!-- Please write a brief summary of your request. -->

## Why?

<!-- Please include the reason for your request and a detailed description of your request. -->

## Related issue(s)

<!-- If there are any related issue(s), would you like to close them? -->

closes

## Check

<!-- Please complete the following checks before submitting. -->

- [ ] Check if duplicate PR(s) already exist.
- [ ] Read `CONTRIBUTING.md` (rules)
- [ ] Run `npm run check` (lint & format)
- [ ] Run `npm test` (functions test)
- [ ] Run `npm run build` (`dist/`)
- [ ] (optional) Run `npm run test:coverage` and check nothing new went uncovered

### If you changed conversion data

<!-- data/*.ts, or anything under scripts/ that regenerates data/*.tsv -->

- [ ] Ran `npm run data:build` and committed the regenerated `src/generated/`
- [ ] Ran `npm run build && npm run coverage:report` and the conversion rate did not drop
- [ ] Explained the reasoning in the source comments, not just here
