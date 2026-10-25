// The course being studied. Each course lives in courses/<id>/ (its course.yaml
// and lesson files); the engine, widgets and styles are shared by all of them.
// The router sets the current course from the URL (#/<id>/...); content.js
// loads files from that folder and progress.js keeps each course's records
// under its own "<id>:" prefix.

let current = null;

export const setCourse = id => { current = id; };
export const courseId = () => current;

// Hash of a page inside the current course: at() is its trail, at('lesson/x') a lesson.
export const at = (path = '') => `#/${current}${path ? `/${path}` : ''}`;

// The course that old links without a course (#/lesson/<id>, ...) belong to.
export const LEGACY_COURSE = 'dg2gr';
