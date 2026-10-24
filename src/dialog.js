// Dialoge: Stimmen fürs Gebrabbel, alle Texte der Figuren und das Dialogfenster.
// Der Text erscheint Buchstabe für Buchstabe; an jeder Silbe blubbert die Stimme der Figur (audio.blub, Effekte-Lautstärke).
// game.talk(id): beim ersten Mal das ganze Gespräch (Spiel hält an, SPRUNG/BISS/Tippen = weiter),
// danach nur ein kurzer Spruch aus „again“, der nebenbei eingeblendet wird. { full: true } spielt das Gespräch immer.

// base = Grundton (Hz), wave = Klang, formant = Größe des „Mauls“ (>1 klein und piepsig, <1 groß und dumpf),
// range = wie weit die Silben in Halbtönen springen, speed = Lesetempo, dur = Silbenlänge, vib = Zittern (alte Stimmen)
export const VOICES = {
  Moll: { base: 330, wave: 'square', formant: 1.15, range: 5, speed: 1.15, dur: 0.07, slide: 0.2, vol: 0.56, face: '🐶', color: '#a0561b' },
  Heribert: { base: 118, wave: 'sawtooth', formant: 0.85, range: 4, speed: 0.85, dur: 0.12, vib: 0.03, vibRate: 7, slide: 0.1, vol: 1.26, face: '🐕', color: '#d35400' },
  Zwergenkönig: { base: 560, wave: 'triangle', formant: 1.45, range: 6, speed: 1.25, dur: 0.06, slide: 0.25, vol: 0.87, face: '👑', color: '#c0392b' },
  'Amtsleiter Bruno': { base: 140, wave: 'sawtooth', formant: 0.95, range: 3, speed: 1.2, dur: 0.08, slide: -0.08, vol: 1.26, face: '💼', color: '#2d3436' },
  Kaffeemaschine: { base: 200, wave: 'square', formant: 1, range: 0, speed: 0.95, dur: 0.09, slide: 0, dry: 0.4, vol: 1.04, face: '☕', color: '#6d4c41' },
  'Bäcker Bruno': { base: 175, wave: 'triangle', formant: 0.95, range: 5, speed: 1, dur: 0.1, slide: 0.15, vol: 2.4, face: '🥨', color: '#d4a373' },
  'Bauer Bernd': { base: 125, wave: 'sawtooth', formant: 1.05, range: 4, speed: 0.95, dur: 0.1, slide: 0.18, vol: 1.26, face: '🌾', color: '#388e3c' },
  'Angler Anton': { base: 135, wave: 'triangle', formant: 0.9, range: 2, speed: 0.7, dur: 0.13, slide: 0.05, vol: 3.12, face: '🎣', color: '#1565c0' },
  'Taucher Tim': { base: 210, wave: 'sine', formant: 0.9, range: 5, speed: 1, dur: 0.1, slide: -0.3, vol: 1.07, dry: 0.6, face: '🤿', color: '#f1c40f' },
  'Fischhändler Fritz': { base: 160, wave: 'square', formant: 1, range: 5, speed: 1.3, dur: 0.07, slide: 0.12, vol: 1.0, face: '🐟', color: '#2980b9' },
  'Kanal-Karl': { base: 112, wave: 'sawtooth', formant: 0.9, range: 2, speed: 0.9, dur: 0.1, slide: 0.06, vol: 1.26, face: '🔦', color: '#f39c12' },
  'Dachs Dieter': { base: 92, wave: 'triangle', formant: 0.8, range: 2, speed: 0.6, dur: 0.16, slide: -0.1, vol: 3.05, face: '🦡', color: '#636e72' },
  'Familie Pudel': { base: 390, wave: 'triangle', formant: 1.2, range: 7, speed: 1.05, dur: 0.08, slide: 0.22, vol: 0.74, face: '🐩', color: '#0984e3' },
  'Rettungsschwimmer Rex': { base: 185, wave: 'sawtooth', formant: 0.95, range: 4, speed: 1.1, dur: 0.08, slide: 0.1, vol: 1.26, face: '🏊', color: '#e74c3c' },
  'Burg-Bauer Bello': { base: 270, wave: 'square', formant: 1.1, range: 5, speed: 1.05, dur: 0.08, slide: 0.18, vol: 0.59, face: '🏰', color: '#1dd1a1' },
  'Verkäuferin Vera': { base: 340, wave: 'triangle', formant: 1.15, range: 6, speed: 1.3, dur: 0.07, slide: 0.2, vol: 0.74, face: '🛍️', color: '#d63031' },
  'Polier Paul': { base: 130, wave: 'sawtooth', formant: 0.95, range: 3, speed: 1, dur: 0.09, slide: -0.06, vol: 1.26, face: '⛑️', color: '#d35400' },
  'Eis-Ella': { base: 440, wave: 'triangle', formant: 1.25, range: 7, speed: 1.2, dur: 0.07, slide: 0.25, vol: 0.87, face: '🍦', color: '#ff7675' },
  'Schaffner Schorsch': { base: 150, wave: 'square', formant: 1, range: 3, speed: 0.9, dur: 0.1, slide: 0.08, vol: 1.0, face: '🚉', color: '#0984e3' },
  'Der dicke Mann': { base: 95, wave: 'sawtooth', formant: 0.8, range: 3, speed: 1.1, dur: 0.11, slide: 0.12, vol: 1.26, face: '😠', color: '#7f8c8d' },
  // Bosse
  'Der Staubsauger': { base: 72, wave: 'sawtooth', formant: 0.75, range: 2, speed: 0.9, dur: 0.13, vib: 0.06, vibRate: 30, slide: 0.05, vol: 1.26, face: '🌀', color: '#8e44ad' },
  'Der große Kater': { base: 300, wave: 'sawtooth', formant: 1.05, range: 6, speed: 0.85, dur: 0.14, slide: -0.25, vib: 0.02, vol: 1.14, face: '🐈‍⬛', color: '#3b3b3b' },
  'Der Dosenöffner': { base: 240, wave: 'square', formant: 1.3, range: 3, speed: 1.2, dur: 0.06, slide: 0, dry: 0.5, vol: 0.89, face: '🥫', color: '#7f8c8d' },
  'Die Obertaube': { base: 190, wave: 'triangle', formant: 0.9, range: 3, speed: 1, dur: 0.11, vib: 0.08, vibRate: 22, vol: 1.2, face: '🕊️', color: '#576574' },
  'Die Möwe': { base: 620, wave: 'sawtooth', formant: 1.3, range: 5, speed: 1.15, dur: 0.08, slide: 0.35, vol: 0.96, face: '🐦', color: '#95a5a6' },
  'Die Kanalratte': { base: 470, wave: 'square', formant: 1.35, range: 6, speed: 1.3, dur: 0.06, slide: 0.3, vol: 0.73, face: '🐀', color: '#6c3483' },
  'Kneifer, die Riesenkrabbe': { base: 165, wave: 'square', formant: 1.1, range: 4, speed: 1.1, dur: 0.06, slide: -0.2, dry: 0.4, vol: 1.0, face: '🦀', color: '#e74c3c' },
  'Die Ratte': { base: 470, wave: 'square', formant: 1.35, range: 6, speed: 1.3, dur: 0.06, slide: 0.3, vol: 0.73, face: '🐀', color: '#6c3483' },
};
const NAMES = { 'Rettungsschwimmer Rex': 'Rex', 'Burg-Bauer Bello': 'Bello', 'Kneifer, die Riesenkrabbe': 'Kneifer' }; // kurze Namen fürs Schild

// Unbekannte Sprecher bekommen eine Stimme aus ihrem Namen, damit niemand stumm bleibt
export function voiceOf(name) {
  if (VOICES[name]) return VOICES[name];
  let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { base: 120 + h % 300, wave: ['square', 'triangle', 'sawtooth'][h % 3], formant: 0.9 + (h >> 4) % 5 * 0.1, range: 4, speed: 1, dur: 0.09, face: '💬', color: '#a0561b' };
}

const B = 'Heribert', M = 'Moll';
export const TALKS = {
  // ---------------------------------------------------------------- Heribert (alter Welsh Corgi Pembroke) lehrt je Welt eine Fähigkeit
  'bruno.apportieren': {
    first: [
      [B, 'Na sieh mal einer an, wer da aus dem Körbchen kriecht! Moll, Mädchen! Gut geschlafen?'],
      [M, 'Heribert! Ich hab geträumt, ich wär ein Würstchen. Und dann hab ich mich selbst gejagt.'],
      [B, 'Hähä! Ich träum immer, meine Beine wären lang. Dann wach ich auf, und – na ja. Immer noch Corgi.'],
      [B, 'Hör zu: Da draußen liegen Goldknochen herum. Hundert Stück! Wer die alle findet, wird eine Legende.'],
      [M, 'Hundert?! Ich kann nur bis drei zählen. Danach kommt gleich „Leckerli“.'],
      [B, 'Dann lernst du unterwegs zählen. Ich hab früher Schafe gehütet, ich weiß, wie man Leute auf Trab bringt. In jeder Welt zeig ich dir einen neuen Trick. Heute: Apportieren!'],
      [B, 'Dort drüben liegt ein Ball. Schnapp ihn mit BISS und bring ihn zu deiner Hütte. Brav sein lohnt sich!'],
      [M, 'Bällchen holen? Heribert, das ist kein Trick. Das ist mein Lebenssinn!'],
    ],
    again: [
      [B, 'Kurze Beine, großes Herz. Und ein noch größerer Hintern. Ein Corgi ist eben gut gebaut.'],
      [B, 'Früher hatten wir keine Goldknochen. Wir hatten Stöckchen. Und wir waren dankbar!'],
      [B, 'Moll, du hast da was im Fell … ach nee, das bist du.'],
      [B, 'Krümel kannst du bei mir gegen feine Sachen tauschen. Kein Umtausch, kein Sabbern auf die Ware!'],
    ],
  },
  'bruno.apportiert': {
    first: [
      [B, 'Brav, Moll! So apportiert man! Und schau mal, was da in deiner Hütte lag … glänzt ja wie mein Napf am Sonntag!'],
      [M, 'Ein GOLDKNOCHEN! Darf ich den essen?'],
      [B, 'Um Himmels willen, nein! Sammeln, Mädchen. SAMMELN. Davon hat man länger was.'],
    ],
  },
  'bruno.laden': {
    again: [
      [B, 'Willkommen in Heriberts Leckerli-Laden! Heute im Angebot: alles, was du dir leisten kannst.'],
      [B, 'Krümel her, Wunder hin – so läuft das Geschäft!'],
      [B, 'Die oberen Regale räumst du bitte selbst ein. Ich komm da nicht ran.'],
    ],
  },
  'bruno.gekauft': {
    again: [
      [B, 'Gute Wahl! Das hätte ich in deinem Alter auch genommen. Wenn ich an die Theke gekommen wäre.'],
      [B, 'Verkauft! An die junge Dame mit der feuchten Nase!'],
      [M, 'Shoppen macht hungrig. Hast du zufällig auch Würstchen im Angebot?'],
    ],
  },
  'bruno.pleite': {
    again: [
      [B, 'Da fehlen noch {n} Krümel, Mädchen. Anschreiben gibt’s nicht – ich vergesse sonst, wem ich was geliehen hab.'],
      [B, 'Noch {n} Krümel! Geh sammeln. Und nicht alles unterwegs aufessen!'],
    ],
  },
  'bruno.trillern': {
    first: [
      [B, 'Psst! Moll! Hier unten. Nein, noch weiter unten. Ich bin’s, Heribert, unterm Schirmständer.'],
      [M, 'Wovor versteckst du dich denn?'],
      [B, 'Vor dem Staubsauger! Der hat mich letzte Woche glatt für einen Wollmops gehalten. Mit meinen Beinen kommt man da nicht schnell genug weg.'],
      [B, 'Damit dir das nicht passiert, lernst du jetzt Trillern: Dreh dich so schnell, dass dir die Ohren flattern!'],
      [M, 'Wie ein Kreisel? Mir wird schon beim Zuhören schwindelig. Herrlich!'],
      [B, 'Am Herd sind drei Drehknöpfe. Trillere sie alle auf – mal sehen, was im Topf hochkocht!'],
    ],
    again: [
      [B, 'Ameisen mögen kein Trillern. Ich mag keine Ameisen. Die kommen mir immer so nah, auf meiner Höhe.'],
      [B, 'Wenn du den Staubsauger siehst: renn! Oder triller. Oder beides, du bist ja jung.'],
    ],
  },
  'bruno.kreisel': {
    again: [
      [B, 'Genau so! Du drehst dich ja wie die Waschmaschine im Schleudergang!'],
      [B, 'Nicht schlecht! Ich hab das auch mal versucht. Bin umgekippt. Corgis sind zum Rollen gebaut, nicht zum Drehen.'],
      [M, 'Die Welt dreht sich … oder bin das ich?'],
    ],
  },
  'bruno.bellen': {
    first: [
      [B, 'Moll! Hierher! In der Stadt ist es laut. Da muss man noch lauter sein.'],
      [M, 'Ich kann laut! Pass auf: … wuff.'],
      [B, 'Das war ein Schluckauf mit Fell. Hör dir mal einen Corgi an: klein, aber Stimme wie ein Nebelhorn!'],
      [B, 'Tief Luft holen … Brust raus … und: WUFF! Siehst du, wie die Tauben fliegen?'],
      [M, 'Die fliegen nicht wegen dem Bellen, Heribert. Die fliegen wegen deinem Atem.'],
      [B, 'Freches Gör! Drei Autos hier haben Alarmanlagen. Bell sie alle an – mal sehen, was passiert!'],
    ],
    again: [
      [B, 'Ein Corgi bellt nicht, um gehört zu werden. Ein Corgi bellt, weil er recht hat.'],
      [B, 'Tauben verstehen nur eine Sprache: WUFF.'],
    ],
  },
  'bruno.bauchklatscher': {
    first: [
      [B, 'Puh … ich warte hier schon seit Dienstag. Meine Nummer ist 4711, aufgerufen wird gerade die 12.'],
      [M, 'Heribert, was machst du denn auf einem Amt?'],
      [B, 'Ich beantrage einen Antrag. Damit ich nächste Woche den richtigen Antrag beantragen darf. Und der Schalter ist so hoch, dass mich keiner sieht.'],
      [B, 'Und weil das dauert, bring ich dir solange was bei. Das Warten muss sich ja lohnen!'],
      [B, 'Heute lernst du den Bauchklatscher. Spring hoch, drück in der Luft BISS – und dann PLUMPS, mit vollem Gewicht nach unten!'],
      [M, 'Mit vollem Gewicht? Ich bin doch federleicht!'],
      [B, 'Nach all den Krümeln? Glaub mir, Mädchen, das kracht. Bei mir kracht’s schon vom Sofa runter. Die drei Riesenstempel am Boden kriegst du nur so runter – und ohne drei Stempel genehmigt hier keiner was!'],
    ],
    again: [
      [B, 'Bürostühle sind was Feines. Man dreht sich, bis man vergisst, warum man reingekommen ist. Wenn man hochkommt.'],
      [B, 'Wenn der Dosenöffner kommt: Bauchklatscher drauf! So erledigt man Papierkram.'],
      [B, 'Hast du schon eine Nummer gezogen? Nein? Dann bist du offiziell gar nicht hier.'],
    ],
  },
  'bruno.buddeln': {
    first: [
      [B, 'Riechst du das, Moll? Bratwurst, Holzkohle und frisch gemähter Rasen. So riecht der Himmel!'],
      [M, 'Bei mir riecht der Himmel nach Leberwurst. Und nach Pfützen.'],
      [B, 'Auch gut. Heute zeig ich dir die schönste Kunst der Welt – gleich nach dem Schlafen: das Buddeln! Und da sind kurze Beine endlich mal ein Vorteil.'],
      [B, 'Vorderpfoten rein, Erde nach hinten schleudern, bloß nicht auf den Gärtner. BISS an einem Erdhügel genügt.'],
      [M, 'Und wenn ich bis ans andere Ende der Welt buddle?'],
      [B, 'Dann winkst du mal. Fünf Erdhügel gibt es hier im Park. In einem riecht es nach Gold!'],
    ],
    again: [
      [B, 'Ich hab hier irgendwo vor zwanzig Jahren einen Knochen vergraben. Wenn du ihn findest: Er gehört mir!'],
      [B, 'Erde unter den Krallen ist der Nagellack des Hundes.'],
    ],
  },
  'bruno.gleiten': {
    first: [
      [B, 'Ahoi, Matrosin! Riechst du die Seeluft? Salz, Fisch und ein Hauch Diesel.'],
      [M, 'Und Möwen. Die riechen nach Ärger.'],
      [B, 'Die Möwen haben’s gut, die können fliegen. Aber wir haben was Besseres: OHREN! Schau dir meine an – das sind keine Ohren, das sind Segel!'],
      [M, 'Heribert … du willst mir nicht im Ernst erzählen, dass ich mit den Ohren fliegen soll.'],
      [B, 'Gleiten! Spring hoch, halt die TRILLER-Taste und lass die Ohren kreisen wie ein Hubschrauber. Helikopter-Ohren!'],
      [M, 'Das ist das Dümmste und Großartigste, was ich je gehört habe!'],
      [B, 'Klettere auf den Ausguck und gleite rüber zum Möwennest. Der Wind über dem Wasser trägt dich!'],
    ],
    again: [
      [B, 'Seemannsregel Nummer eins: Nie gegen den Wind sabbern.'],
      [B, 'Bei starkem Wind muss ich die Ohren anlegen. Sonst heb ich ab und lande in Holland.'],
    ],
  },
  'bruno.wandsprung': {
    first: [
      [B, 'Ach, das Dorf! Hier hab ich früher die Schafe gehütet. Die haben mich nie ernst genommen. Bis ich sie in die Fersen gezwickt hab.'],
      [M, 'Und heute?'],
      [B, 'Heute hüte ich dich. Ist anstrengender. Die Schafe haben wenigstens zugehört.'],
      [B, 'Heute: Wandsprung! Spring gegen eine Backsteinwand und stoß dich mit SPRUNG wieder ab. Hin und her, wie ein Flummi mit Fell!'],
      [M, 'Pfoten an die Wand, Wand an die Pfoten … verstanden! Kannst du das auch?'],
      [B, 'Mit diesen Beinen? Ich spring höchstens gegen die Fußleiste. Siehst du den alten Schornstein? Spring zwischen den Wänden hin und her bis ganz nach oben!'],
    ],
    again: [
      [B, 'Im Dorf grüßt man sich. Also grüß die Hühner. Aber jag sie nicht – jedenfalls nicht, wenn Bauer Bernd hinschaut.'],
      [B, 'Früher war hier alles Wiese. Heute ist hier immer noch alles Wiese. Herrlich, wenn sich nichts ändert.'],
    ],
  },
  'bruno.tornado': {
    first: [
      [B, 'Moll … nicht erschrecken, ich bin’s. Hier unten riecht’s, als hätte jemand Socken gekocht.'],
      [M, 'Heribert, du riechst aber auch nicht gerade nach Rosen. Und dein Bauch schleift durchs Abwasser.'],
      [B, 'Das ist Parfüm! „Eau de Pfütze“. Sehr teuer. Und der Bauch ist wasserdicht.'],
      [B, 'Jetzt kommt mein bester Trick: Tornado-Trillern! Halt am Boden TRILLER gedrückt, bis es funkelt … und dann lass los!'],
      [M, 'Ein Wirbelsturm aus Hund! Die Kanalratte wird Augen machen.'],
      [B, 'Die Kanalratte ist kein Spaß, Mädchen. Die ist größer als ich – und das will was heißen. Na gut, es heißt nicht viel. Über dir hängt ein Lüftungsschacht – lad das Trillern auf und schieß als Tornado hoch!'],
    ],
    again: [
      [B, 'Pass auf die Ratte auf. Die hat mir mal das Pausenbrot geklaut. Mitsamt der Dose.'],
      [B, 'Hier unten ist es so dunkel, ich hab vorhin mit einem Rohr geredet. Es war ein guter Zuhörer.'],
    ],
  },
  'bruno.zoomies': {
    first: [
      [B, 'Moll! Ich hab vom Gartenzaun aus alles gesehen! Durch ein Astloch, ganz unten. Du bist gerannt wie ein geölter Blitz!'],
      [M, 'Ich weiß gar nicht, was passiert ist. Meine Beine haben einfach … ZOOOOM gemacht!'],
      [B, 'Das sind die Zoomies! Die kriegt jeder anständige Hund. Bei mir sieht das aus wie ein Brötchen auf Rollschuhen, aber das Gefühl ist dasselbe.'],
      [B, 'Lauf mit vollem Tempo geradeaus, dann rast du los und springst viel weiter. Nur nicht durch Omas Blumenbeet!'],
    ],
    again: [[B, 'Zoomies sind wie Schluckauf: Man kann sie nicht steuern, aber sie machen Spaß.']],
  },

  // ---------------------------------------------------------------- Garten
  zwerge: {
    first: [
      ['Zwergenkönig', 'Halt! Wer betritt das Reich von König Gartulf dem Ersten?'],
      [M, 'Ich. Moll. Ich wohne hier. Du stehst in MEINEM Garten.'],
      ['Zwergenkönig', 'Papperlapapp! Der Garten ist mein Königreich. Du bist bloß ein sehr großer Untertan mit Mundgeruch.'],
      ['Zwergenkönig', 'Meine fünf Untertanen sind verschwunden! Einfach in den Urlaub gefahren. Ohne Antrag! Bring sie zurück!'],
      [M, 'Fünf Zwerge suchen. Das klingt nach einem Märchen, in dem ich nicht mitspielen wollte.'],
    ],
    again: [
      ['Zwergenkönig', 'Bisher sind {n} von 5 Untertanen zurück. Ein König zählt mit!'],
      ['Zwergenkönig', 'Zwerge verstecken sich gern auf Hügeln, unter Büschen und hinter Ausreden. Noch {r} fehlen!'],
      ['Zwergenkönig', 'Ein König steht nicht einfach herum. Er THRONT. {n} von 5, weitermachen!'],
    ],
  },
  'zwerge.fertig': {
    first: [
      ['Zwergenkönig', 'Fünf von fünf! Mein Reich ist wieder vollständig! Du darfst dich ab sofort „Ritterin vom Gartenschlauch“ nennen.'],
      [M, 'Gibt’s dazu auch was zu essen?'],
      ['Zwergenkönig', 'Besser: einen Goldknochen! Er liegt drüben beim Haus. Königliche Großzügigkeit, ganz umsonst. Na ja – fast.'],
    ],
  },

  // ---------------------------------------------------------------- Das Büro (Amt)
  chef: {
    first: [
      ['Amtsleiter Bruno', 'Termin? Haben Sie einen Termin? Ohne Termin kein Termin! Und ohne Termin auch keinen Termin für einen Termin!'],
      [M, 'Bist du mit Bäcker Bruno verwandt?'],
      ['Amtsleiter Bruno', 'Dafür bin ich nicht zuständig. Verwandtschaftsfragen: Zimmer 0815, Kellergeschoss. Das Amt hat kein Kellergeschoss.'],
      ['Amtsleiter Bruno', 'Mein goldener Beamter-des-Monats-Knochen steht ganz oben im Pokalschrank. 47 Monate in Folge!'],
      [M, 'Wie viele Beamte gibt es hier denn?'],
      ['Amtsleiter Bruno', '… Einen. Mich. Aber das Auswahlverfahren hat elf Jahre gedauert!'],
    ],
    again: [
      ['Amtsleiter Bruno', 'Formular A38 gibt es am Schalter 1. Schalter 1 ist heute geschlossen. Bitte gehen Sie zu Schalter 1.'],
      ['Amtsleiter Bruno', 'Sprechstunde Dienstag von 9:00 bis 9:05. Ungerade Wochen. In Schaltjahren.'],
      ['Amtsleiter Bruno', 'Stempel drauf, Stempel drunter, Stempel daneben. Ordnung muss sein!'],
    ],
  },
  kaffee: {
    first: [
      ['Kaffeemaschine', 'GUTEN MORGEN. ICH BIN DIE KAFFEEMASCHINE 3000, AMTLICH GEPRÜFT. BITTE 4 TASSEN EINSTELLEN.'],
      [M, 'Kannst du auch Kakao?'],
      ['Kaffeemaschine', 'KAKAO MUSS SCHRIFTLICH BEANTRAGT WERDEN. BEARBEITUNGSZEIT: 6 BIS 8 WOCHEN. AKTUELLE TASSEN: {n} VON 4.'],
    ],
    again: [
      ['Kaffeemaschine', 'BITTE. 4. TASSEN. EINSTELLEN. AKTUELL: {n}. BLUBB.'],
      ['Kaffeemaschine', 'TASSEN: {n} VON 4. ICH WARTE. ICH HABE ZEIT. ICH BIN IM ÖFFENTLICHEN DIENST.'],
    ],
  },
  'kaffee.fertig': {
    first: [
      ['Kaffeemaschine', 'TASSEN VOLLSTÄNDIG. VORGANG WIRD BEARBEITET … BRÜHE … STEMPEL … BLUBB, ZISCH! ERGEBNIS: 1 GOLDKNOCHEN. GENEHMIGT.'],
      [M, 'Der beste Kaffee, den ich nie getrunken habe!'],
    ],
  },

  // ---------------------------------------------------------------- Dorf
  baecker: {
    first: [
      ['Bäcker Bruno', 'Ach du Schreck, ach du Graus – die Tauben trugen die Kekse raus!'],
      [M, 'Kekse? Wo? Welche? Wie viele? Darf ich?'],
      ['Bäcker Bruno', 'Fünf Hundekekse, frisch gebacken, und jetzt liegen sie im ganzen Dorf verteilt. Bringst du sie zurück? Ganz, bitte – nicht angeknabbert!'],
      [M, 'Ganz? Ich verspreche … es zu versuchen.'],
    ],
    again: [
      ['Bäcker Bruno', '{n} von 5 Keksen sind wieder da. Und ich zähle die Krümel nach!'],
      ['Bäcker Bruno', 'Wer backt, hat’s nicht leicht: Erst ist der Teig zu weich, dann sind die Tauben zu frech. Noch {r}!'],
    ],
  },
  'baecker.fertig': {
    first: [
      ['Bäcker Bruno', 'Meine Kekse! Alle fünf und kaum Bissspuren! Hier, das lag im Ofen – hart wie Gold. Weil es Gold IST!'],
      [M, 'Und ich krieg wirklich keinen Keks?'],
      ['Bäcker Bruno', 'Na gut. Einen halben. Für die Nerven.'],
    ],
    again: [['Bäcker Bruno', 'Morgen gibt’s Laugenknochen! Die Tauben kriegen keine.']],
  },
  bauer: {
    first: [
      ['Bauer Bernd', 'Moll! Gut, dass du da bist! Meine Hühner sind ausgebüxt! Alle fünf!'],
      [M, 'Hühner jagen? Darf ich wirklich? Ganz offiziell?'],
      ['Bauer Bernd', 'Fangen, nicht fressen! Ein BISS, ganz sanft, wie ein Küsschen. Dann setz ich sie zurück in den Stall.'],
      [M, 'Ein Küsschen mit Zähnen. Verstanden!'],
    ],
    again: [
      ['Bauer Bernd', '„Gack-gack“ heißt bei Hühnern „Fang mich doch“. Glaub ich.'],
      ['Bauer Bernd', 'Hühner sind schlau. Nicht so schlau wie Schweine, aber schlauer als mein Traktor.'],
    ],
  },
  'bauer.fertig': {
    first: [
      ['Bauer Bernd', 'Alle Hühner im Stall! Gut gemacht, Moll! Im Hof liegt was Goldenes, das gehört dir.'],
      [M, 'Ehrlich gesagt hatte ich die ganze Zeit Hunger. Aber ich war tapfer.'],
    ],
  },
  angler: {
    first: [
      ['Angler Anton', 'Pssst … du verscheuchst die Fische.'],
      [M, 'Ich hab doch gar nichts gemacht!'],
      ['Angler Anton', 'Du hast gedacht. Fische hören das.'],
      ['Angler Anton', 'Auf der Weideninsel glitzert was. Über die Seerosen kommst du trocken hin.'],
      [M, 'Fische hören Gedanken? Dann denk ich jetzt ganz laut: WURST!'],
    ],
    again: [
      ['Angler Anton', 'Seit sechs Stunden kein Biss. Ich glaube, die Fische machen Urlaub.'],
      ['Angler Anton', 'Angeln ist wie Warten. Nur mit Stock.'],
    ],
  },

  // ---------------------------------------------------------------- Hafen
  tim: {
    first: [
      ['Taucher Tim', 'Blubb! Oh, entschuldige, alte Gewohnheit. Ich bin Taucher Tim!'],
      [M, 'Warum trägst du an Land eine Taucherbrille?'],
      ['Taucher Tim', 'Falls es plötzlich regnet. Nimm meine Ersatzbrille, dann kannst du tauchen!'],
    ],
    again: [['Taucher Tim', 'Nimm meine Ersatzbrille, dann kannst du tauchen! Blubb!']],
  },
  'tim.tauchen': {
    first: [
      ['Taucher Tim', 'Du hast ja schon eine Brille! Dann verrat ich dir was: Im Hafenbecken liegt ein alter Anker – und was Goldenes daneben!'],
      [M, 'Unter Wasser? Hoffentlich ist es kein goldener Seeigel.'],
    ],
    again: [
      ['Taucher Tim', 'Unter Wasser ist es ganz still. Bis auf die Krabben. Die tratschen.'],
      ['Taucher Tim', 'Beim alten Anker glitzert’s. Blubb!'],
    ],
  },
  fritz: {
    first: [
      ['Fischhändler Fritz', 'Frischer Fisch! Frischer Fisch! Fast frischer Fisch! Gestern frischer Fisch!'],
      [M, 'Hast du auch Würstchen?'],
      ['Fischhändler Fritz', 'Würstchen? Am Fischstand? Das ist, als würdest du den Bäcker nach Socken fragen!'],
      ['Fischhändler Fritz', 'Da oben auf dem Balken liegt was Goldenes – aber ich bin zu alt zum Klettern. Und zu klug.'],
    ],
    again: [
      ['Fischhändler Fritz', 'Fischers Fritz verkauft frische Fische, frische Fische verkauft Fischers Fritz! Sag das mal mit vollem Maul.'],
      ['Fischhändler Fritz', 'Die Möwe klaut mir jeden Tag einen Hering. Ich führ schon ein Konto für sie.'],
    ],
  },

  // ---------------------------------------------------------------- Kanal
  karl: {
    first: [
      ['Kanal-Karl', 'Wer da?! Ach, ein Hund. Puh. Ich dachte schon, die Ratte.'],
      [M, 'Die Ratte? Wie groß ist die denn?'],
      ['Kanal-Karl', 'Groß genug, dass ich hier unten nur noch flüstere. Die Notlampen sind aus! Die vier Schalter sind in Pumpwerk, Rohren, Becken und Schacht.'],
      [M, 'Licht an, Ratte weg. Klingt nach einem Plan!'],
    ],
    again: [
      ['Kanal-Karl', 'Ich arbeite seit zwanzig Jahren im Kanal. Riechen kann ich seit neunzehn nicht mehr.'],
      ['Kanal-Karl', 'Im Dunkeln sehen alle Rohre gleich aus. Außer dem einen. Das hat mich angeguckt.'],
    ],
  },

  // ---------------------------------------------------------------- Grillpark
  dieter: {
    first: [
      ['Dachs Dieter', 'Hmpf … wer weckt mich? Es ist doch erst … Herbst.'],
      [M, 'Entschuldigung! Schläfst du immer im Park?'],
      ['Dachs Dieter', 'Ich schlafe überall. Das ist mein Talent. Ganz hinten in meinem Bau liegt was Goldenes. Nimm’s mit, es glänzt so beim Schlafen.'],
      [M, 'Gute Nacht, Dieter!'],
      ['Dachs Dieter', 'Chrrr …'],
    ],
    again: [
      ['Dachs Dieter', 'Chrrr … Würstchen … chrrr …'],
      ['Dachs Dieter', 'Fünf Minuten noch … oder fünf Monate.'],
    ],
  },
  pudel: {
    first: [
      ['Familie Pudel', 'Oh là là, eine Katastrophe! Der Wind hat unser Picknick über den ganzen Park geweht!'],
      [M, 'Ein Picknick? Mit Essen? Ich helfe! Ganz selbstlos!'],
      ['Familie Pudel', 'Fünf Sachen fehlen. Bring sie zurück, ma chérie, und wir sind dir ewig dankbar. Oder zumindest bis zum Nachtisch.'],
    ],
    again: [
      ['Familie Pudel', '{n} von 5 Sachen sind zurück. Der Rest fliegt noch herum, très tragique!'],
      ['Familie Pudel', 'Noch {r} Sachen! Und bitte nichts unterwegs probieren, ja?'],
    ],
  },
  'pudel.fertig': {
    first: [
      ['Familie Pudel', 'Alles wieder da! Formidable! Hier, ein kleines Dankeschön – in Gold!'],
      [M, 'Und das Käsebrot?'],
      ['Familie Pudel', 'Das Käsebrot … ist leider schon gegessen. Von dir. Vorhin.'],
    ],
    again: [['Familie Pudel', 'Danke, der Picknickkorb ist wieder voll! Diesmal binden wir ihn fest.']],
  },
  'dicker.mann': {
    again: [
      ['Der dicke Mann', 'HEY! Weg da, Hund! Das sind MEINE Pommes!'],
      ['Der dicke Mann', 'Schon wieder du?! Husch, husch!'],
      ['Der dicke Mann', 'Ich hab Augen im Hinterkopf! … Na gut, im Seitenkopf.'],
    ],
  },

  // ---------------------------------------------------------------- Strand
  rex: {
    first: [
      ['Rettungsschwimmer Rex', 'Hey, Kleine! Rettungsschwimmer Rex, zu Diensten. Muskeln aus Stahl, Fell aus Seide.'],
      [M, 'Und das Ego aus Luftballon.'],
      ['Rettungsschwimmer Rex', 'Ha! Frech, gefällt mir. Nimm die Taucherbrille – unter Wasser liegen die besten Sachen!'],
    ],
    again: [['Rettungsschwimmer Rex', 'Nimm die Taucherbrille! Ohne Brille ist Tauchen nur Nasewaschen.']],
  },
  'rex.tauchen': {
    again: [
      ['Rettungsschwimmer Rex', 'Viel Spaß im Wasser! Fordere mich am Strand zum Wettschwimmen heraus!'],
      ['Rettungsschwimmer Rex', 'Zwanzig Liegestütze am Morgen, dann ein Eis. So bleibt man in Form.'],
    ],
  },
  'rex.ohnebrille': { again: [['Rettungsschwimmer Rex', 'Hol dir erst die Taucherbrille an der Promenade! Sicherheit geht vor.']] },
  'rex.rennen': {
    first: [
      ['Rettungsschwimmer Rex', 'Wettschwimmen zur Inselflagge? Ich geb dir sogar zwei Sekunden Vorsprung. Ach was – eine.'],
      [M, 'Pass lieber auf, dass du deine Sonnenbrille nicht verlierst, Muskelprotz!'],
      ['Rettungsschwimmer Rex', 'Auf die Plätze … fertig … LOS!'],
    ],
    again: [['Rettungsschwimmer Rex', 'Revanche? Auf die Plätze … fertig … LOS!']],
  },
  'rex.verloren': {
    first: [
      ['Rettungsschwimmer Rex', 'Du … bist ja schneller als ein Seehund! Wie hast du das gemacht?'],
      [M, 'Ich hab mir einfach vorgestellt, die Flagge ist ein Würstchen.'],
    ],
  },
  bello: {
    first: [
      ['Burg-Bauer Bello', 'Vorsicht! Nicht auf die Zugbrücke treten! Die ist aus nassem Sand und großen Träumen.'],
      [M, 'Eine echte Sandburg! Wohnt da schon jemand?'],
      ['Burg-Bauer Bello', 'Noch nicht. Mir fehlen 5 Muscheln für die Türmchen. Bringst du sie mir? Dann bist du Ehrengast!'],
    ],
    again: [
      ['Burg-Bauer Bello', 'Bring mir 5 Muscheln für die Burg! Bisher hab ich {n}.'],
      ['Burg-Bauer Bello', 'Ein Burgherr ohne Muscheln ist nur ein Hund mit Eimer. Noch {r}!'],
    ],
  },
  'bello.fertig': {
    first: [
      ['Burg-Bauer Bello', 'Fünf Muscheln! Meine Burg ist perfekt! Hier, das hab ich beim Graben vom Burggraben gefunden.'],
      [M, 'Und wer wohnt jetzt in der Burg?'],
      ['Burg-Bauer Bello', 'Ein Krebs. Er zahlt keine Miete, aber er ist sehr ordentlich.'],
    ],
    again: [['Burg-Bauer Bello', 'Danke nochmal für die Muscheln! Der Krebs lässt grüßen.']],
  },

  // ---------------------------------------------------------------- Einkaufsstraße
  vera: {
    first: [
      ['Verkäuferin Vera', 'Herzlich willkommen im Kaufhaus! Heute alles zum halben Preis! Außer dem, was du willst.'],
      [M, 'Ich will nur gucken.'],
      ['Verkäuferin Vera', 'Das sagen sie alle. Oben im zweiten Stock steht unser goldenes Ausstellungsstück. Nur gucken, nicht anknabbern!'],
    ],
    again: [
      ['Verkäuferin Vera', 'Hunde müssen leider draußen bleiben. Ach, du bist schon drin? Na dann.'],
      ['Verkäuferin Vera', 'Die Rolltreppe ist kaputt? Nein, Schätzchen, das ist jetzt eine Treppe.'],
    ],
  },
  paul: {
    first: [
      ['Polier Paul', 'Halt! Baustelle! Betreten verboten! Außer mit Helm.'],
      [M, 'Ich hab aber keinen Helm.'],
      ['Polier Paul', 'Dann tu so, als ob. Machen wir hier alle. Übers Gerüst kommst du bis aufs Dach.'],
    ],
    again: [
      ['Polier Paul', 'Frühstückspause ist von acht bis zwölf. Danach Mittagspause.'],
      ['Polier Paul', 'Wir bauen seit drei Jahren an diesem Haus. Fertig wird’s nie, aber schön.'],
    ],
  },
  ella: {
    first: [
      ['Eis-Ella', 'Uaaah! Meine Kugeln! Mir sind 3 Eiskugeln davongerollt – bis in andere Viertel!'],
      [M, 'Eis! Welche Sorten?'],
      ['Eis-Ella', 'Vanille, Erdbeer und Leberwurst-Stracciatella. Die Leberwurst ist für Hunde. Bring sie mir zurück, bevor sie schmelzen!'],
    ],
    again: [
      ['Eis-Ella', '{n} von 3 Kugeln sind zurück. Schnell, die Sonne scheint!'],
      ['Eis-Ella', 'Eine Eisdiele ohne Eis ist nur eine Diele. Noch {r}!'],
    ],
  },
  'ella.fertig': {
    first: [
      ['Eis-Ella', 'Meine Kugeln! Danke! Das hier hab ich hinten im Eisschrank gefunden. Ein bisschen kalt, aber golden!'],
      [M, 'Und die Leberwurst-Kugel …?'],
      ['Eis-Ella', 'Gehört dir. In der Waffel, mit Sahne. Für Heldinnen.'],
    ],
  },
  schorsch: {
    first: [
      ['Schaffner Schorsch', 'Zurückbleiben, bitte! … Ach, du bist ja gar kein Zug.'],
      [M, 'Nee, ich bin ein Hund. Ein schneller Hund!'],
      ['Schaffner Schorsch', 'Die Bahnhofsuhr hat oben einen goldenen Zeiger … oder? Ich schau nie hoch. Ich schau nur auf die Verspätungen.'],
    ],
    again: [
      ['Schaffner Schorsch', 'Der nächste Zug hat zwanzig Minuten Verspätung. Der übernächste auch. Tradition.'],
      ['Schaffner Schorsch', 'Fahrkarten, bitte! … Keine? Na gut, Hunde fahren umsonst.'],
    ],
  },

  // ---------------------------------------------------------------- Rattenrennen und Albtraum
  'runner.rattenrennen': {
    first: [
      ['Die Ratte', 'Hihihi! Ein Wettfressen, Hündchen? Wer mehr Würstchen schnappt, gewinnt. Ich hab seit Dienstag nichts gegessen!'],
      [M, 'Und ich seit fünf Minuten. Das ist viel schlimmer!'],
    ],
  },
  'runner.albtraum': {
    first: [
      ['Die Ratte', 'Willkommen in meinem Traum! Hier ist alles aus Käse. Die Wände, der Boden – sogar die Angst!'],
      [M, 'Ich hab keine Angst. Ich hab Hunger. Bei mir ist das dasselbe.'],
    ],
  },

  // ---------------------------------------------------------------- Bosse: reimen gern, Moll kontert
  'boss.kueche': {
    first: [
      ['Der Staubsauger', 'BRRRMMM! Ich sauge Staub, ich sauge Haar, ich sauge Hunde – wunderbar!'],
      [M, 'Du saugst höchstens beim Reimen!'],
      ['Der Staubsauger', 'Frecher Fussel, kleiner Wicht, gleich verschwindest du – Gesicht zuerst! BRRRMMM!'],
      [M, 'Das hat sich nicht mal gereimt.'],
    ],
  },
  'boss.strasse': {
    first: [
      ['Der große Kater', 'Miau, wie nett, ein Hund zu Gast. Du kommst genau zur Mittagsrast …'],
      [M, 'Runter vom Dach, du Pelzpantoffel!'],
      ['Der große Kater', 'Ich kratz dich klein, ich fauch dich platt, dann bin ich König dieser Stadt!'],
    ],
  },
  'boss.buero': {
    first: [
      ['Der Dosenöffner', 'KLACK, KLACK! Antrag auf Dosenöffnung: ABGELEHNT! Hier öffne nur ICH – mit Stempel und Brief!'],
      [M, 'Der Thunfisch in der Kantine gehört allen, du Blechbüchse!'],
      ['Der Dosenöffner', 'Ich schneide Blech, ich schneide fein – gleich wirst du abgeheftet sein!'],
    ],
  },
  'boss.strand': {
    first: [
      ['Kneifer, die Riesenkrabbe', 'Zwick, zwack, ich bin der Kneifer! Mein Strand, mein Sand, ich werd nur steifer … äh, schneller!'],
      [M, 'Du riechst wie alter Seetang mit Sonnencreme.'],
      ['Kneifer, die Riesenkrabbe', 'Meine Scheren klappern laut – gleich hab ich dir das Fell geklaut!'],
    ],
  },
  'boss.hafen': {
    first: [
      ['Die Möwe', 'KREEEE! Mein Fisch, mein Kai, mein Meer – du kleiner Köter, gib das her!'],
      [M, 'Das ist nicht dein Fisch! Den hast du Fritz geklaut!'],
      ['Die Möwe', 'Geklaut, gefunden, was macht das schon? Gleich fliegst du baden – das ist dein Lohn!'],
    ],
  },
  'boss.dorf': {
    first: [
      ['Die Obertaube', 'GURR! Ich bin die Obertaube und thron im Kirchturm, wie ich glaube!'],
      [M, '„Wie ich glaube“? Du weißt nicht mal, wo du wohnst?'],
      ['Die Obertaube', 'Ruhe! Meine Tauben sind schnell und schlau – gleich gibt’s für dich ein großes … GURR-AU!'],
    ],
  },
  'boss.kanal': {
    first: [
      ['Die Kanalratte', 'Hihihi! Im Dunkeln bin ich flink und schnell, ich fress den Käse und dein Fell!'],
      [M, 'Mein Fell bleibt schön an mir dran, vielen Dank!'],
      ['Die Kanalratte', 'Wer mich jagt, der jagt im Traum – und aus dem Albtraum kommt man kaum!'],
    ],
  },
  'bossdown.kueche': { again: [[M, 'Ausgesaugt! Jetzt bist du nur noch ein Mopp mit Kabel.']] },
  'bossdown.strasse': { again: [['Der große Kater', 'Miau-weh … ich geh mich putzen. Und schmollen.']] },
  'bossdown.buero': { again: [[M, 'Dose auf, Akte zu – Feierabend!']] },
  'bossdown.strand': { again: [['Kneifer, die Riesenkrabbe', 'Zwick … zwack … ich geh seitwärts nach Hause.']] },
  'bossdown.hafen': { again: [['Die Möwe', 'KREEE … Na gut. Dann klau ich eben bei den Touristen.']] },
  'bossdown.dorf': { again: [['Die Obertaube', 'Gurr … ab heute bin ich nur noch Untertaube.']] },
};

const VOWELS = 'aeiouäöüy';
// Pausen nach Satzzeichen (Sekunden): so atmen die Figuren zwischen den Sätzen
const PAUSE = { '.': 0.22, '!': 0.22, '?': 0.24, ',': 0.1, ';': 0.12, ':': 0.12, '…': 0.3, '–': 0.12 };

export class Dialog {
  constructor(game) {
    this.game = game; this.auto = false; this.log = []; this.queue = []; this.line = null; this.mode = null; this.last = {};
    const el = this.el = document.getElementById('dialog');
    if (el) {
      this.$ = { box: el.querySelector('.box'), face: el.querySelector('.face'), name: el.querySelector('.name'), shown: el.querySelector('.shown'), rest: el.querySelector('.rest') };
      el.addEventListener('pointerdown', e => { if (this.mode === 'talk') { e.preventDefault(); this.advance(); } });
    }
  }
  get open() { return this.mode === 'talk'; }

  // Gespräch oder kurzer Spruch, je nachdem ob die Figur Moll schon kennt
  talk(id, o = {}) {
    const t = TALKS[id]; if (!t) { console.warn('Dialog fehlt:', id); o.onDone?.(); return; }
    const save = this.game.save, seen = (save.talked ||= {})[id];
    if (t.first && (!seen || o.full)) {
      if (!seen) { save.talked[id] = 1; this.game.persist(); }
      return this.play(t.first, o);
    }
    const pool = t.again || t.first.filter(l => l[0] !== M).slice(-1);
    let i = Math.floor(Math.random() * pool.length); if (pool.length > 1 && i === this.last[id]) i = (i + 1) % pool.length; this.last[id] = i;
    this.chat(pool[i][0], pool[i][1], o); o.onDone?.();
  }
  _fill(text, vars = {}) { return text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m); }

  // Ganzes Gespräch: Spiel hält an, bis alle Zeilen durch sind
  play(lines, o = {}) {
    const ls = lines.map(([who, text]) => ({ who, text: this._fill(text, o.vars) }));
    this.log.push(...ls);
    if (this.auto || !this.el) { o.onDone?.(); return; }
    this.queue = ls; this.onDone = o.onDone; this.mesh = o.mesh; this.mode = 'talk';
    this.el.className = 'show block'; this.game.input.vibrate?.(20); this._next();
  }
  // Kurzer Spruch nebenbei: Spiel läuft weiter, Fenster blendet sich von selbst aus
  chat(who, text, o = {}) {
    const line = { who, text: this._fill(text, o.vars) }; this.log.push(line);
    if (this.auto || !this.el || this.mode === 'talk') return;
    this.mode = 'chat'; this.queue = []; this.onDone = null; this.mesh = o.mesh;
    this.el.className = 'show chat'; this._show(line);
  }
  _next() { const l = this.queue.shift(); if (l) this._show(l); else this.close(); }
  _show(l) {
    const v = voiceOf(l.who); this.line = l; this.voice = v; this.i = 0; this.t = 0; this.wait = 0; this.hold = 0; this.syl = 0; this.prevVowel = false;
    this.loud = l.text.replace(/[^A-ZÄÖÜa-zäöüß]/g, '').length > 6 && l.text === l.text.toUpperCase() ? 1.35 : 1;
    this.$.face.textContent = v.face; this.$.name.textContent = NAMES[l.who] || l.who; this.$.box.style.setProperty('--c', v.color);
    // Mund des Sprechers: Moll selbst oder die Figur, mit der sie redet
    this.head = this.mode === 'talk' && (l.who === M ? this.game.player?.mesh : this.mesh)?.userData?.head || null; this.head0 ??= new Map();
    if (this.head && !this.head0.has(this.head)) this.head0.set(this.head, this.head.rotation.x);
    this.$.shown.textContent = ''; this.$.rest.textContent = l.text;
    this.el.classList.add('typing'); this.el.classList.remove('wait');
    this.$.box.classList.remove('pop'); void this.$.box.offsetWidth; this.$.box.classList.add('pop');
  }
  // Erster Druck: Text sofort ganz zeigen. Zweiter Druck: nächste Zeile.
  advance() {
    if (!this.line) return;
    if (this.i < this.line.text.length) { this.i = this.line.text.length; this._render(); this._doneTyping(); }
    else if (this.mode === 'talk') { this.game.audio.sfx('click'); this._next(); }
  }
  close() {
    const cb = this.onDone; this._rest(); this.mode = null; this.line = null; this.queue = []; this.onDone = null; this.mesh = null;
    if (this.el) this.el.className = '';
    cb?.();
  }
  // Weltwechsel: offenes Gespräch ohne Rückruf schließen
  reset() { this.onDone = null; this.close(); }
  _rest() { if (this.head && this.head0?.has(this.head)) this.head.rotation.x = this.head0.get(this.head); }
  _render() { const s = this.line.text; this.$.shown.textContent = s.slice(0, this.i); this.$.rest.textContent = s.slice(this.i); }
  _doneTyping() {
    this.el.classList.remove('typing'); this.el.classList.add('wait'); this._rest();
    this.hold = this.mode === 'chat' ? 1.6 + this.line.text.length * 0.035 : 0;
  }
  // Tasten im Gespräch: SPRUNG/BISS = weiter, Pause = Gespräch überspringen
  input(i) {
    if (i.pressed('jump') || i.pressed('act')) this.advance();
    else if (i.pressed('pause')) { this.queue = []; this.close(); }
  }
  // Eigene Uhr statt Spiel-dt (das ist auf 0,05 s gedeckelt): Lesetempo bleibt auch auf langsamen Geräten gleich
  update() {
    const now = performance.now(), dt = Math.min(0.25, (now - (this._now ?? now)) / 1000); this._now = now;
    const l = this.line; if (!l) return;
    if (this.i >= l.text.length) { if (this.mode === 'chat' && (this.hold -= dt) <= 0) this.close(); return; }
    const v = this.voice; this.t += dt;
    if (this.head) this.head.rotation.x = this.head0.get(this.head) + Math.abs(Math.sin(this.t * 16)) * 0.12;
    if (this.wait > 0) { this.wait -= dt; return; }
    const cps = 38 * (v.speed || 1); let n = 0;
    this.acc = (this.acc || 0) + dt * cps;
    while (this.acc >= 1 && this.i < l.text.length) {
      this.acc -= 1; const ch = l.text[this.i++], lc = ch.toLowerCase(), vowel = VOWELS.includes(lc); n++;
      // Neue Silbe = erster Vokal nach einem Nicht-Vokal: dort blubbert die Stimme
      if (vowel && !this.prevVowel) this._blub(lc);
      this.prevVowel = vowel;
      if (PAUSE[ch] && this.i < l.text.length) { this.wait = PAUSE[ch] / (v.speed || 1); this.acc = 0; break; }
    }
    if (n) this._render();
    if (this.i >= l.text.length) this._doneTyping();
  }
  _blub(vowel) {
    const v = this.voice, l = this.line.text, k = this.syl++;
    // Tonhöhe: kleine Melodie aus Silbe und Zeichen, Fragen steigen am Ende an
    let h = (k * 7 + l.charCodeAt(this.i - 1) * 13) % 11 / 10 * 2 - 1, step = Math.round(h * (v.range ?? 4));
    const rest = l.length - this.i, q = l.trimEnd().endsWith('?');
    if (q && rest < 8) step += 4 + (8 - rest) * 0.6; else if (rest < 4) step -= 2;
    this.game.audio.blub(v, vowel, step, this.loud);
  }
}
