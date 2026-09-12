-- Add new "About" page translations for 4-step workflow
insert into public.translations (key, language, value, updated_at)
values
  ('about.step1Title', 'sv', 'Hitta & utforska på kartan', timezone('utc', now())),
  ('about.step1Title', 'en', 'Discover & explore on the map', timezone('utc', now())),
  ('about.step1Text', 'sv', 'Använd den interaktiva kartan eller "Nära mig" för att upptäcka platser i ditt närområde som har outnyttjad potential.', timezone('utc', now())),
  ('about.step1Text', 'en', 'Use the interactive map or "Near Me" to discover locations in your neighborhood with untapped potential.', timezone('utc', now())),
  
  ('about.step2Title', 'sv', 'Visualisera din vision', timezone('utc', now())),
  ('about.step2Title', 'en', 'Visualize your vision', timezone('utc', now())),
  ('about.step2Text', 'sv', 'Dela en tydlig före- och efterbild. Bjud in medskapare och lokala kreatörer för att göra förslaget ännu starkare.', timezone('utc', now())),
  ('about.step2Text', 'en', 'Share clear before-and-after imagery. Invite collaborators and local creators to make the vision even stronger.', timezone('utc', now())),
  
  ('about.step3Title', 'sv', 'Engagera i realtid', timezone('utc', now())),
  ('about.step3Title', 'en', 'Engage in real-time', timezone('utc', now())),
  ('about.step3Text', 'sv', 'Samla röster, stöd och diskutera idéer live med grannar. Dela förslaget enkelt vidare till andra i området.', timezone('utc', now())),
  ('about.step3Text', 'en', 'Gather votes, support, and discuss ideas live with neighbors. Easily share proposals with your local community.', timezone('utc', now())),
  
  ('about.step4Title', 'sv', 'Följ tidslinjen till verklighet', timezone('utc', now())),
  ('about.step4Title', 'en', 'Follow the timeline to reality', timezone('utc', now())),
  ('about.step4Text', 'sv', 'Se förslagets resa i realtid: från Idé till Kommunal granskning, Planering och slutligen Genomfört projekt.', timezone('utc', now())),
  ('about.step4Text', 'en', 'Track the proposal''s journey in real-time: from Idea to Municipal review, Planning, and finally Completed project.', timezone('utc', now())),
  
  ('about.howTitle', 'sv', 'Från idé till genomfört stadslyft.', timezone('utc', now())),
  ('about.howTitle', 'en', 'From idea to completed city lift.', timezone('utc', now())),
  ('about.howText', 'sv', 'Stadslyft är byggt för att göra det enkelt att gå från en idé till verklig förändring i stadsrummet – steg för steg tillsammans med dina grannar och kommunen.', timezone('utc', now())),
  ('about.howText', 'en', 'Stadslyft is built to make it easy to go from an idea to real urban change – step by step together with your neighbors and municipality.', timezone('utc', now())),
  
  ('about.localPerspectives', 'sv', 'Dela lokala perspektiv och upptäck projekt nära dig', timezone('utc', now())),
  ('about.localPerspectives', 'en', 'Share local perspectives and discover projects near you', timezone('utc', now())),
  ('about.localArtists', 'sv', 'Låt lokala konstnärer och kreatörer bidra med visioner', timezone('utc', now())),
  ('about.localArtists', 'en', 'Invite local artists and creators to contribute creative visions', timezone('utc', now())),
  ('about.beforeAfter', 'sv', 'Gör idéer begripliga med före- och visionbilder', timezone('utc', now())),
  ('about.beforeAfter', 'en', 'Make ideas tangible with before-and-vision images', timezone('utc', now())),
  ('about.signals', 'sv', 'Tydlig tidslinje och dialog från idé till färdigt resultat', timezone('utc', now())),
  ('about.signals', 'en', 'Clear timeline and progress tracking from idea to completion', timezone('utc', now()))
on conflict (key, language) do update set
  value = excluded.value,
  updated_at = timezone('utc', now());
