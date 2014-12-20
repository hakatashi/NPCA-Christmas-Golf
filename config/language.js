var languages = {
	C: 'C',
	'C++': 'C++ 4.8.1',
	Python: 'Python',
	Ruby: 'Ruby',
	Java: 'Java',
	PHP: 'PHP',
	'Node.js': 'Node.js',
	Brainfuck: 'Brainf**k',
	Scheme: 'Scheme (guile)'
};

exports.languageMap = languages;

exports.languages = Object.keys(languages);
exports.languageIDs = Object.keys(languages).map(function (language) { return languages[language] });
