module.exports = {
  '*.{ts,tsx}': (files) => {
    const filtered = files.filter((f) => !f.includes('_archived'));
    if (filtered.length === 0) return [];
    const paths = filtered.map((f) => `"${f}"`).join(' ');
    return [`eslint --fix ${paths}`, `prettier --write ${paths}`];
  },
  '*.{json,md,css}': ['prettier --write'],
};
