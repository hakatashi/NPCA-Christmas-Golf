var languages = {
	c: {
		name: 'C',
		point: 50
	},
	cpp: {
		name: 'C++ 4.8.1',
		point: 50
	},
	python: {
		name: 'Python',
		point: 30
	},
	ruby: {
		name: 'Ruby',
		point: 30
	},
	java: {
		name: 'Java',
		point: 50
	},
	php: {
		name: 'PHP',
		point: 30
	},
	node: {
		name: 'Node.js',
		point: 30
	},
	brainfuck: {
		name: 'Brainf**k',
		point: 50
	},
	scheme: {
		name: 'Scheme (guile)',
		point: 50
	},
	fortran: {
		name: 'Fortran',
		point: 50
	},
	perl: {
		name: 'Perl',
		point: 30
	},
	haskell: {
		name: 'Haskell',
		point: 30
	},
	go: {
		name: 'Go',
		point: 30
	},
	lua: {
		name: 'Lua',
		point: 50
	},
	ocaml: {
		name: 'OCaml',
		point: 50
	}
};

exports.languages = languages;
exports.languagenames = Object.keys(languages).map(function (key) { return languages[key].name });
