const data = {
  skills: ['HTML', 'CSS/SCSS/SASS', 'JavaScript', 'JQuery', 'React', 'ES6', 'Bootstrap', 'Git', 'Excel', 'Photoshop', 'Illustrator'],
  softSkills: ['Effective Communication', 'Collaboration', 'Self Learning', 'Problem Solving', 'Multitasking', 'Adaptability'],
  summary:
    'Detail-oriented Front End Web Developer brings strong commitment to collaboration and solutions-oriented problem-solving. Lending more than 20 years of expertise in Front End Web Development in fast-paced environments requiring fast turnaround. Committed to high standards of user experience and usability. Enthusiastic about learning and applying modern web methodologies.',
  history: [
    {
      companyTitle: 'SGSco/Kwikee - Web Developer  •  Peoria, IL',
      dates: '08/2016&ndash;06/2019',
      duties: [
        'Collaborated with Project Managers and clients to develop custom marketing solutions.',
        'Front-end development using HTML, CSS, SCSS, JavaScript, jQuery and Bootstrap.',
        'Utilized front-end development solutions; e.g. Rich Text Editing, Responsive Design, Parsing complex JSON structures, LinkedIn and Facebook API Workflows.',
        'Played vital role in life cycle of websites to ensure success. Planning, quoting, developing, debugging, documenting, maintaining, and updating.',
        'Research and development of modern web methodologies.',
      ],
    },
    {
      companyTitle: 'MultiAd - UI Developer  •  Peoria, IL',
      dates: '09/2011&ndash;08/2016',
      duties: [
        'Designed UIs within front-end web frameworks such as YUI3, exploiting their modules and implementing data tables, navigation, and color pickers.',
        'Worked closely with back-end developers to expedite display of server-based data.',
        'Employed coding practices based on commonly accepted standards while maintaining cross-browser compatibility.',
        'Created client administered intranet portals for content management.',
      ],
    },
    {
      companyTitle: 'MultiAd Services Inc. - Web Designer  •  Peoria, IL',
      dates: '09/1999&ndash;07/2011',
      duties: [
        'Designed and executed user interfaces, flowcharts, and wireframes.',
        'Created, maintained, and updated all front end aspects of website including HTML, CSS, JavaScript, image editing, form creation/validation, and copywriting.',
        'Created sites for content management and direct-to-print marketing materials.',
      ],
    },
  ],
};

const build = () => {
  // Skills
  let skills = [];
  data.skills.map(item => {
    skills.push('<li class="list-group-item">' + item + '</li>');
  });
  document.getElementById('skills').innerHTML = skills.join('');

  // Soft Skills
  let softSkills = [];
  data.softSkills.map(item => {
    softSkills.push('<li class="list-group-item">' + item + '</li>');
  });
  document.getElementById('soft-skills').innerHTML = softSkills.join('');

  // Professional Summary
  document.getElementById('summary').innerHTML = data.summary;

  // Work History
  let history = [],
    liArr = [];
  data.history.map(item => {
    history.push('<p>' + item.companyTitle + '<br/>' + item.dates + '</p>');
    item.duties.map(dutiesItem => {
      liArr.push('<li>' + dutiesItem + '</li>');
    });
    history.push('<ul>' + liArr.join('') + '</ul>');
    liArr = [];
    document.getElementById('duties').innerHTML = history.join('');
  });
};