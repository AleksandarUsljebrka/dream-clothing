/* Sadržaj sajta. Novi dizajn = novi objekat u nizu `designs`.
   Slike idu u /img kao  {slug}-{broj}-640.webp  i  {slug}-{broj}-1280.webp  */
window.DREAM = {
  instagram: 'dream_clothingshop',
  designs: [
    {
      slug: 'overthinking',
      mood: 'day',
      lines: ['Overthinking', 'solves', 'nothing'],
      meaning: 'Prestani da vrtiš isti film u glavi. Odluči i kreni.',
      photos: 6
    },
    {
      slug: 'dream-big',
      mood: 'day',
      lines: ['Dream big', 'work hard', 'stay focused'],
      meaning: 'Sanjaj krupno, radi ozbiljno i ne skreći pogled sa cilja.',
      photos: 3
    },
    {
      slug: 'dont-overshare',
      mood: 'day',
      lines: ["Don't", 'overshare', 'not everyone is your friend'],
      meaning: 'Ne mora svako da zna tvoj plan. Neka vide rezultat.',
      photos: 2
    },
    {
      slug: 'stay-humble',
      mood: 'day',
      lines: ['Stay humble', 'even when you', 'are succeeding'],
      meaning: 'Kad ti krene, ostani isti.',
      photos: 1
    },
    {
      slug: 'push-beyond',
      mood: 'night',
      lines: ['Push', 'beyond', 'limits'],
      meaning: 'Kad misliš da više ne možeš, uradi još malo.',
      photos: 3
    },
    {
      slug: 'nothing-changes',
      mood: 'night',
      lines: ['Nothing changes', 'if nothing', 'changes'],
      meaning: 'Ako radiš isto što i do sad, dobićeš isto što i do sad.',
      photos: 6
    },
    {
      slug: 'focus',
      mood: 'night',
      lines: ['Focus on', 'your goals', 'not your fear'],
      meaning: 'Strah će uvek imati nešto da kaže. Ti gledaj u cilj.',
      photos: 5
    }
  ],

  /* Galerija: dve trake po 7 fotografija.
     slug + n = koja fotografija, ar = oblik kartice (širina / visina), pos = koji deo slike ostaje vidljiv.
     Iste majice su razmaknute, da dve slike istog printa ne stoje jedna do druge. */
  gallery: {
    day: [ // gornji red, ide ulevo
      { slug: 'overthinking', n: 6, ar: '4 / 5', pos: '50% 50%' },
      { slug: 'dream-big', n: 2, ar: '2 / 3', pos: '50% 40%' },
      { slug: 'overthinking', n: 4, ar: '1 / 1', pos: '50% 60%' },
      { slug: 'dont-overshare', n: 2, ar: '2 / 3', pos: '50% 40%' },
      { slug: 'overthinking', n: 2, ar: '1 / 1', pos: '50% 40%' },
      { slug: 'dream-big', n: 3, ar: '2 / 3', pos: '50% 50%' },
      { slug: 'stay-humble', n: 1, ar: '4 / 5', pos: '50% 50%' }
    ],
    night: [ // donji red, ide udesno
      { slug: 'push-beyond', n: 2, ar: '1 / 1', pos: '50% 45%' },
      { slug: 'nothing-changes', n: 2, ar: '2 / 3', pos: '50% 50%' },
      { slug: 'focus', n: 3, ar: '4 / 5', pos: '50% 40%' },
      { slug: 'nothing-changes', n: 6, ar: '2 / 3', pos: '50% 50%' },
      { slug: 'push-beyond', n: 3, ar: '4 / 5', pos: '50% 40%' },
      { slug: 'nothing-changes', n: 4, ar: '1 / 1', pos: '50% 45%' },
      { slug: 'focus', n: 4, ar: '4 / 5', pos: '50% 40%' }
    ]
  }
};
