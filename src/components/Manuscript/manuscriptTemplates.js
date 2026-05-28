// Structural templates for manuscript setup.
// Each template generates acts/chapters when applied; users can freely edit all content afterward.
// guidance fields are editable hints shown in the sidebar — not locked content.

export const MANUSCRIPT_TEMPLATES = [
  {
    id: 'three-act',
    name: 'Three Act Structure',
    genre: 'General Fiction',
    description: 'The classic setup-confrontation-resolution framework. Reliable, battle-tested, and flexible enough for almost any story.',
    targetWords: 90000,
    acts: [
      {
        title: 'Act I — Setup',
        guidance: 'Establish the world, introduce your protagonist, and present the inciting incident that disrupts the status quo. End with a clear first turning point that forces your character into the main conflict.',
        chapters: [
          { title: 'Opening Image', guidance: 'First impression of your world and hero. Sets the tone and emotional baseline you will contrast against the ending.' },
          { title: 'Ordinary World', guidance: 'Show life before the story disrupts it. Plant seeds of your theme and hint at your protagonist\'s fatal flaw.' },
          { title: 'Inciting Incident', guidance: 'The event that kicks the story into motion. Your protagonist can\'t ignore it — it forces a choice.' },
          { title: 'Debate & Decision', guidance: 'Your hero resists the call. Show what they stand to lose. End with them committing to Act II.' },
        ],
      },
      {
        title: 'Act II — Confrontation',
        guidance: 'Your protagonist pursues their goal and meets escalating obstacles. The midpoint raises the stakes dramatically. Everything falls apart at the low point before a second turning point forces the final push.',
        chapters: [
          { title: 'Entering New World', guidance: 'Your hero steps into unfamiliar territory — a new place, problem, or way of life. Establish new rules and relationships.' },
          { title: 'Fun & Games', guidance: 'Deliver the story\'s promise — the reason readers picked this book. Explore, test, win small victories.' },
          { title: 'Midpoint', guidance: 'A major shift: false victory, false defeat, or a revelation that reframes everything. Stakes rise. The hero commits fully.' },
          { title: 'Bad Guys Close In', guidance: 'External pressure intensifies. Internal cracks widen. Allies fracture or betray. The protagonist\'s flaw starts costing them.' },
          { title: 'All Is Lost', guidance: 'The lowest point. The plan fails. Something important is lost — hope, a relationship, a belief. The protagonist must change or die (figuratively or literally).' },
          { title: 'Dark Night of the Soul', guidance: 'Your hero sits with the failure. What do they choose to believe? This is where theme crystallizes.' },
        ],
      },
      {
        title: 'Act III — Resolution',
        guidance: 'Armed with a new understanding, your protagonist makes one final push against the antagonist. The climax resolves the central conflict; the denouement shows how the world has changed.',
        chapters: [
          { title: 'Break Into Three', guidance: 'The hero finds the answer — often hidden in plain sight. They decide to act, even if it means sacrifice.' },
          { title: 'Climax', guidance: 'The final confrontation. Your protagonist faces the antagonist (person, system, or inner demon) with everything on the line. Theme is proven.' },
          { title: 'Closing Image', guidance: 'Mirror the opening but show transformation. Leave the reader with an emotional resonance that lingers.' },
        ],
      },
    ],
  },

  {
    id: 'heros-journey',
    name: "Hero's Journey",
    genre: 'Epic / Adventure / Fantasy',
    description: "Joseph Campbell's monomyth — the mythic cycle of departure, initiation, and return. Ideal for epic fantasy, adventure, and coming-of-age stories.",
    targetWords: 110000,
    acts: [
      {
        title: 'Departure',
        guidance: 'The hero exists in their ordinary world until a call to adventure disrupts everything. After resistance and encouragement, they cross the threshold into the unknown.',
        chapters: [
          { title: 'Ordinary World', guidance: 'Establish who your hero is before the journey changes them. Show their routine, relationships, and the wound they carry.' },
          { title: 'Call to Adventure', guidance: 'A herald arrives — a message, a stranger, a crisis. The hero is summoned to a quest they didn\'t ask for.' },
          { title: 'Refusal of the Call', guidance: 'The hero hesitates. Fear, duty, or disbelief holds them back. Show what keeps them tied to the ordinary world.' },
          { title: 'Meeting the Mentor', guidance: 'A wise figure offers guidance, tools, or encouragement. They don\'t do the work — they prepare the hero to do it themselves.' },
          { title: 'Crossing the Threshold', guidance: 'The hero commits and enters the special world. There\'s no easy return. Rules are different here.' },
        ],
      },
      {
        title: 'Initiation',
        guidance: 'The hero navigates challenges, temptations, and a supreme ordeal in the special world. They die and are reborn — metaphorically or literally — and seize their reward.',
        chapters: [
          { title: 'Tests, Allies, Enemies', guidance: 'The hero learns the rules of the new world by being tested. They discover who they can trust.' },
          { title: 'Approach to the Inmost Cave', guidance: 'Preparation for the ordeal. The hero and allies edge toward the greatest danger. Tension builds.' },
          { title: 'The Ordeal', guidance: 'The supreme crisis — death and rebirth. Your hero faces their greatest fear. Something must be sacrificed for them to emerge transformed.' },
          { title: 'The Reward', guidance: 'Having survived, the hero seizes the prize: an object, knowledge, reconciliation, or inner truth.' },
        ],
      },
      {
        title: 'Return',
        guidance: 'The hero brings their reward back to the ordinary world — but the road home is treacherous. A final test proves the transformation was real before the hero is integrated into a changed world.',
        chapters: [
          { title: 'The Road Back', guidance: 'The hero must return, but the journey isn\'t over. Old enemies pursue; the reward creates new complications.' },
          { title: 'Resurrection', guidance: 'A final, climactic ordeal that tests everything the hero learned. They must apply their transformation or die.' },
          { title: 'Return with the Elixir', guidance: 'The hero comes home changed, bringing a gift that heals the ordinary world — wisdom, freedom, love, or literal treasure.' },
        ],
      },
    ],
  },

  {
    id: 'save-the-cat',
    name: 'Save the Cat',
    genre: 'Commercial Fiction / Screenwriting',
    description: "Blake Snyder's beat sheet adapted for novels. Precise pacing with 15 named beats. Great for commercial fiction that needs to move fast and satisfy completely.",
    targetWords: 85000,
    acts: [
      {
        title: 'Act One',
        guidance: 'Establish your hero and world quickly, then deliver the inciting catalyst. End with the hero fully committed to the act two journey.',
        chapters: [
          { title: 'Opening Image', guidance: 'A single image that sets the tone and shows the "before" world. It will contrast with your closing image to prove transformation.' },
          { title: 'Theme Stated', guidance: 'Someone (not the hero) states the theme — the lesson your hero will learn, usually in a throwaway line they don\'t yet understand.' },
          { title: 'Set-Up', guidance: 'Establish the hero\'s ordinary world and all six things that need to change. Show the hero\'s flaw in action.' },
          { title: 'Catalyst', guidance: 'The inciting incident that knocks the hero\'s world off balance. They can\'t ignore it. Page 12 energy.' },
          { title: 'Debate', guidance: 'The hero resists. Should they go? Can they? Show the internal struggle before they decide. End on the leap of faith.' },
        ],
      },
      {
        title: 'Act Two (Part A)',
        guidance: 'The hero enters a new world — an upside-down version of act one — and has fun exploring it. A false victory at the midpoint shifts everything.',
        chapters: [
          { title: 'Break Into Two', guidance: 'The hero makes a proactive choice and enters the upside-down world. No going back. Thesis world gives way to antithesis world.' },
          { title: 'B Story', guidance: 'A new character enters — often a love interest or mentor — who carries the theme. This is the emotional heart of your story.' },
          { title: 'Fun and Games', guidance: 'The promise of the premise. Deliver what the logline sells. The hero tests their new world. Audience pleasure zone.' },
          { title: 'Midpoint', guidance: 'False victory or false defeat. Stakes raise. Hero seems to win or lose publicly. The fun-and-games phase is over.' },
        ],
      },
      {
        title: 'Act Two (Part B)',
        guidance: 'The antagonistic forces regroup and overwhelm the hero. An internal flaw causes a major setback. Everything the hero built falls apart.',
        chapters: [
          { title: 'Bad Guys Close In', guidance: 'External pressure and internal doubt mount simultaneously. Allies become liabilities. The plan unravels.' },
          { title: 'All Is Lost', guidance: 'The false defeat: the worst thing that can happen, happens. Often features a "whiff of death" — someone or something dies.' },
          { title: 'Dark Night of the Soul', guidance: 'The hero wallows in hopelessness. The old world is gone. The new world won\'t accept them. Who are they now?' },
        ],
      },
      {
        title: 'Act Three',
        guidance: 'The hero discovers the solution — often by synthesizing thesis and antithesis — and executes the final plan, proving their transformation in a climactic showdown.',
        chapters: [
          { title: 'Break Into Three', guidance: 'The A and B stories collide: the hero\'s relationship insight unlocks the solution to the main plot. The answer was there all along.' },
          { title: 'Finale', guidance: 'Execute the final plan in a five-point sequence: gather the team, execute the plan, execute it again when it fails, the real climax, the aftermath.' },
          { title: 'Final Image', guidance: 'Mirror the opening image. Show the hero\'s transformation through contrast. Prove the theme worked.' },
        ],
      },
    ],
  },

  {
    id: 'romantasy',
    name: 'Romantasy Structure',
    genre: 'Romantasy / Fantasy Romance',
    description: 'Dual-engine structure: a fantasy quest arc and a romance arc intertwined. Both must resolve satisfyingly — neither can be purely a subplot of the other.',
    targetWords: 120000,
    acts: [
      {
        title: 'Part One — Collision',
        guidance: 'Establish your heroine in her world, introduce the fantasy stakes, and force the first encounter with the love interest under hostile or fraught circumstances. Plant the enemies-to-lovers or reluctant-allies dynamic.',
        chapters: [
          { title: 'Her World', guidance: 'Ground readers in your protagonist\'s life, her power (or lack thereof), and what she wants vs. what she needs.' },
          { title: 'The Fantasy Inciting Incident', guidance: 'The quest, prophecy, threat, or political crisis that sets the main plot in motion.' },
          { title: 'First Encounter', guidance: 'The meeting that matters. Conflict, chemistry, or both. Something about this person gets under her skin.' },
          { title: 'Forced Together', guidance: 'Circumstances — a mission, a contract, a curse — force your couple to cooperate despite their friction.' },
        ],
      },
      {
        title: 'Part Two — Kindling',
        guidance: 'The quest deepens and so does the relationship. Banter evolves into genuine connection. A major fantasy revelation and an emotional turning point (almost-kiss, vulnerable confession, or betrayal) land close together.',
        chapters: [
          { title: 'On the Road / In the World', guidance: 'The quest begins in earnest. Shared danger forces trust. Banter and worldbuilding intertwine.' },
          { title: 'Cracks in the Armor', guidance: 'Both characters reveal something real beneath the posturing. Vulnerability, backstory, or a shared wound.' },
          { title: 'The Almost', guidance: 'A moment that almost becomes something more — interrupted kiss, pulled-back confession, charged silence. Readers know. The characters almost do.' },
          { title: 'Fantasy Midpoint Revelation', guidance: 'A major plot twist reframes the quest. The stakes grow larger or more personal. The couple\'s mission shifts.' },
          { title: 'Emotional Climax of Part Two', guidance: 'The romance escalates: first kiss, confession, or night together. The relationship becomes real — which means it can now be broken.' },
        ],
      },
      {
        title: 'Part Three — The Fracture',
        guidance: 'External enemies and internal doubts conspire to tear the couple apart. A betrayal (real or perceived) hits at the worst moment as the fantasy stakes reach their crisis point.',
        chapters: [
          { title: 'The Cost of Love', guidance: 'The relationship creates complications for the quest — or vice versa. One must be sacrificed for the other, or so it seems.' },
          { title: 'Betrayal or Break', guidance: 'The couple is separated — by a lie exposed, a sacrifice demanded, a misunderstanding weaponized by the villain.' },
          { title: 'Fantasy Low Point', guidance: 'The quest seems unwinnable. The villain\'s plan is revealed in full. The world is at its most desperate.' },
          { title: 'Alone', guidance: 'Both characters face their darkest moment alone. What do they each choose when they have nothing left?' },
        ],
      },
      {
        title: 'Part Four — The Triumph',
        guidance: 'The couple reunites, the fantasy conflict reaches its climax, and both arcs resolve. The world is saved. The relationship is earned. End with emotional and narrative satisfaction.',
        chapters: [
          { title: 'Reunion', guidance: 'They find each other again. The misunderstanding is resolved or the sacrifice is acknowledged. This reunion must be earned, not handed over.' },
          { title: 'Final Battle', guidance: 'The fantasy climax. Both characters fight — together and separately — for the world and for each other.' },
          { title: 'The Declaration', guidance: 'The romantic climax. Grand gesture, plain words, or quiet certainty — whatever fits these characters. Make readers feel it.' },
          { title: 'Epilogue', guidance: 'Show the new world — and the new relationship within it. Leave readers satisfied and, if series, hungry for more.' },
        ],
      },
    ],
  },

  {
    id: 'mystery-thriller',
    name: 'Mystery / Thriller',
    genre: 'Mystery / Thriller / Suspense',
    description: 'A case or threat drives relentless forward momentum. Clues, suspects, reversals, and a ticking clock keep tension high. The solution must be both surprising and inevitable.',
    targetWords: 90000,
    acts: [
      {
        title: 'The Hook',
        guidance: 'Establish your detective/protagonist and deliver the inciting crime or threat as quickly as possible. Give readers a reason to be afraid and a reason to trust your protagonist to solve it.',
        chapters: [
          { title: 'Opening Crime or Threat', guidance: 'Start as close to the action as possible. A body, a threat, a disappearance. Establish tone immediately.' },
          { title: 'Meet the Investigator', guidance: 'Who is your detective/protagonist? What is their particular skill set, wound, or obsession that makes them right (and wrong) for this case?' },
          { title: 'Entering the Case', guidance: 'The protagonist is pulled into the investigation — voluntarily or not. Establish the central question: whodunit, will they survive, can they stop it?' },
          { title: 'First Clues & Suspects', guidance: 'Begin laying the groundwork. Every clue you plant here must matter. Every suspect introduced needs a motive.' },
        ],
      },
      {
        title: 'Investigation',
        guidance: 'The investigator pursues leads, interviews suspects, and pieces together a picture — only to have that picture shattered by a midpoint reversal. False solutions collapse under new evidence.',
        chapters: [
          { title: 'Following Leads', guidance: 'The investigation opens up. New evidence, new suspects, new complications. Maintain multiple live threads.' },
          { title: 'False Lead / Red Herring', guidance: 'A promising lead goes nowhere — or implicates the wrong person. Your protagonist (and reader) must recover and reorient.' },
          { title: 'Tightening Circle', guidance: 'Evidence accumulates. The suspect list narrows. Your protagonist gets close — close enough to become a target.' },
          { title: 'Midpoint Reversal', guidance: 'A revelation that flips the case. The obvious suspect is cleared, a trusted ally is implicated, or the crime turns out to be something else entirely.' },
          { title: 'Raising the Stakes', guidance: 'The threat escalates. Another victim, a deadline, or a personal threat against the investigator. They can no longer stay detached.' },
          { title: 'The Trap', guidance: 'The investigator attempts to catch the villain — but the trap is turned against them. They are now the prey.' },
        ],
      },
      {
        title: 'The Reckoning',
        guidance: 'The pieces fall into place through a combination of deduction and desperation. The confrontation with the true villain resolves the case — and the protagonist\'s personal arc.',
        chapters: [
          { title: 'Darkest Hour', guidance: 'The case seems unsolvable. The protagonist is discredited, trapped, or grieving. The villain seems to have won.' },
          { title: 'The Revelation', guidance: 'The final piece clicks into place. The protagonist sees what they missed. The truth should feel both surprising and inevitable.' },
          { title: 'Confrontation', guidance: 'The showdown with the villain — in a courtroom, a dark room, or at gunpoint. The case is resolved, but so must the personal stakes be.' },
          { title: 'Resolution', guidance: 'The aftermath. Justice (or its absence). How the protagonist is changed. Close out the personal arc that has run alongside the case.' },
        ],
      },
    ],
  },

  {
    id: 'episodic-tv',
    name: 'Episodic TV Structure',
    genre: 'Serialized / Series / TV Adaptation',
    description: 'For novels that think in seasons and episodes — ensemble casts, multiple POVs, parallel plots, and season-long arcs with satisfying episode-level resolution.',
    targetWords: 100000,
    acts: [
      {
        title: 'Season Premiere (Act I)',
        guidance: 'Establish your world, ensemble, and the season-long conflict. Deliver a pilot-quality hook that sets up every major thread. End on a cliffhanger that demands the next episode.',
        chapters: [
          { title: 'Cold Open', guidance: 'A gripping in-media-res moment that establishes tone and stakes. You can return to this scene later — it doesn\'t have to be chronological.' },
          { title: 'World & Ensemble', guidance: 'Introduce your world and key characters efficiently. Every major player who will matter this season should appear or be implied.' },
          { title: 'The Season Threat', guidance: 'Establish the central conflict that will span the season: the enemy, the mystery, the collapse that must be stopped or resolved.' },
          { title: 'Pilot Cliffhanger', guidance: 'End the first episode/chapter block on a hook that makes it impossible not to continue. A revelation, a death, a betrayal.' },
        ],
      },
      {
        title: 'Rising Action (Act II-A)',
        guidance: 'The ensemble pursues their separate threads, each with their own episode-level arcs. Cross-thread connections tighten. A midseason twist reshuffles alliances.',
        chapters: [
          { title: 'Episode 2 — Character Depth', guidance: 'Slow down slightly to invest in relationships and backstory. The threat is real, but humans are complicated.' },
          { title: 'Episode 3 — Complications', guidance: 'Secondary conflicts emerge. Not everything is about the main threat. Let the world feel lived-in and layered.' },
          { title: 'Episode 4 — Collision', guidance: 'Two major threads intersect unexpectedly. Characters from different storylines are forced together.' },
          { title: 'Midseason Twist', guidance: 'A revelation that reshuffles the board. An ally becomes an enemy, a hidden truth surfaces, or the nature of the threat changes.' },
        ],
      },
      {
        title: 'Falling Action (Act II-B)',
        guidance: 'The ensemble fractures under pressure. Episode-level crises compound. Individual characters face defining choices that will determine their arcs heading into the finale.',
        chapters: [
          { title: 'Episode 6 — The Fracture', guidance: 'Alliances strain or break. The ensemble cannot function as a unified force. Personal agendas surface.' },
          { title: 'Episode 7 — Personal Stakes', guidance: 'Zoom in. What does each major character stand to lose personally? This is the episode that cements emotional investment.' },
          { title: 'Episode 8 — Crisis Point', guidance: 'The situation reaches a critical mass. Multiple threads converge. The stakes are undeniable. Something must give.' },
          { title: 'Pre-Finale Setup', guidance: 'Position all pieces for the finale. Establish what each character needs to do — and what stands in their way.' },
        ],
      },
      {
        title: 'Finale (Act III)',
        guidance: 'All threads converge in a climactic sequence that resolves the season-long arc while planting seeds for the next. Individual character arcs conclude — some satisfyingly, some as cliffhangers.',
        chapters: [
          { title: 'Assembling the Team', guidance: 'Characters who have been separated or at odds must come together for the final push. Each brings what only they can bring.' },
          { title: 'The Final Gambit', guidance: 'The plan is executed — and begins to fall apart. Improvisation, sacrifice, and unexpected heroism.' },
          { title: 'Climax', guidance: 'The season threat is resolved. Multiple character arcs pay off simultaneously. The price of victory is real.' },
          { title: 'Season Coda', guidance: 'The aftermath. Who survived and how have they changed? Plant the hook for next season without undermining this one\'s resolution.' },
        ],
      },
    ],
  },

  {
    id: 'blank',
    name: 'Blank / Custom',
    genre: 'Any',
    description: 'Start with a clean slate. One act, one chapter — add and organize everything yourself. For writers who prefer to discover their structure rather than follow one.',
    targetWords: 80000,
    acts: [
      {
        title: 'Act One',
        guidance: 'This is your first act. Rename it, adjust the guidance, and build the structure that fits your story.',
        chapters: [
          { title: 'Chapter One', guidance: 'Your first chapter. Add scenes, set the scene, begin your story.' },
        ],
      },
    ],
  },
]

export function getTemplateById(id) {
  return MANUSCRIPT_TEMPLATES.find(t => t.id === id) ?? null
}
