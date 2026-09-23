import assert from 'node:assert/strict';
import { selectActiveSection } from '../src/hooks/activeSection.js';

const viewport = { activationY: 102, viewportHeight: 1080, atBottom: false };
const select = (sections, overrides) => selectActiveSection(sections, { ...viewport, ...overrides });
assert.equal(select([{ id: 'about', top: 500, bottom: 1400 }]), '', 'Upcoming About must not be active on hero');
assert.equal(select([{ id: 'hero', top: 0, bottom: 500 }, { id: 'about', top: 500, bottom: 1400 }]), 'hero');
assert.equal(select([{ id: 'about', top: -798, bottom: 102 }, { id: 'projects', top: 102, bottom: 1002 }]), 'projects', 'Boundary selects exactly one section');
assert.equal(select([{ id: 'projects', top: -500, bottom: 400 }, { id: 'faq', top: 400, bottom: 800 }], { atBottom: true }), 'faq', 'Short final section activates at page bottom');
assert.equal(select([{ id: 'projects', top: -500, bottom: 400 }, { id: 'faq', top: 400, bottom: 800 }]), 'projects');
assert.equal(select([]), '', 'Document pages without sections have no active navigation');
assert.equal(select([{ id: 'about', top: -1000, bottom: -100 }], { atBottom: true }), '', 'Footer does not reactivate an offscreen section');
console.log('Scrollspy geometry checks passed. Browser interaction checks are separate.');
