/**
 * Comprehensive Pregnancy Week-by-Week Information
 * Data compiled from WHO, Mayo Clinic, NHS, ACOG, and BabyCenter
 * Last updated: October 2025
 */

import { PREGNANCY_WEEKS_DATA_HI } from './pregnancy-weeks-data-hi';

export interface WeeklyPregnancyInfo {
    week: number;
    trimester: 1 | 2 | 3;
    babySize: string;
    babyWeight: string;
    babyLength: string;
    babyDevelopment: string[];
    maternalChanges: string[];
    symptoms: string[];
    tipsAndAdvice: string[];
    icon: string;
    milestone?: string;
}

export const PREGNANCY_WEEKS_DATA: WeeklyPregnancyInfo[] = [
    {
        week: 4,
        trimester: 1,
        babySize: "Poppy seed",
        babyWeight: "Less than 1g",
        babyLength: "0.2 mm",
        babyDevelopment: [
            "Baby is starting to attach to your womb",
            "Brain and spine are beginning to form",
            "Baby's first cells are growing",
            "A protective bubble (sac) forms around baby"
        ],
        maternalChanges: [
            "Your body is making pregnancy hormones",
            "Your womb is getting ready to grow",
            "You have more blood in your body now"
        ],
        symptoms: [
            "Missed period",
            "Light spotting",
            "Mild cramping",
            "Tender breasts",
            "Feeling tired"
        ],
        tipsAndAdvice: [
            "Start taking pregnancy vitamins with folic acid",
            "Book your first doctor visit",
            "Don't drink alcohol or smoke",
            "Drink lots of water and eat healthy food"
        ],
        icon: "🌱",
        milestone: "Your pregnancy begins!"
    },
    {
        week: 5,
        trimester: 1,
        babySize: "Sesame seed",
        babyWeight: "< 1g",
        babyLength: "2 mm",
        babyDevelopment: [
            "Heart begins to beat",
            "Neural tube developing into brain and spinal cord",
            "Blood vessels forming",
            "Tiny buds for arms and legs appear"
        ],
        maternalChanges: [
            "HCG levels doubling rapidly",
            "Hormone changes affecting body",
            "Uterus size of a small orange"
        ],
        symptoms: [
            "Morning sickness may begin",
            "Frequent urination",
            "Increased fatigue",
            "Food cravings or aversions",
            "Mood swings"
        ],
        tipsAndAdvice: [
            "Eat small, frequent meals for nausea",
            "Keep crackers by bedside",
            "Rest when tired",
            "Stay active with gentle exercise"
        ],
        icon: "💗"
    },
    {
        week: 6,
        trimester: 1,
        babySize: "Sweet pea",
        babyWeight: "< 1g",
        babyLength: "4-5 mm",
        babyDevelopment: [
            "Heart beating 110 times per minute",
            "Facial features forming",
            "Tiny arm and leg buds visible",
            "Brain and nervous system developing rapidly"
        ],
        maternalChanges: [
            "Increased sense of smell",
            "Breast changes becoming noticeable",
            "Slight weight changes possible"
        ],
        symptoms: [
            "Morning sickness intensifies",
            "Breast tenderness",
            "Fatigue",
            "Bloating",
            "Mild cramping"
        ],
        tipsAndAdvice: [
            "Try ginger tea for nausea",
            "Wear comfortable, supportive bra",
            "Avoid trigger smells",
            "Stay hydrated with water and clear fluids"
        ],
        icon: "🫛"
    },
    {
        week: 7,
        trimester: 1,
        babySize: "Blueberry",
        babyWeight: "< 1g",
        babyLength: "10 mm",
        babyDevelopment: [
            "Brain growing rapidly",
            "Arms and legs lengthening",
            "Hands and feet forming",
            "Vital organs developing",
            "Umbilical cord clearly visible"
        ],
        maternalChanges: [
            "Uterus doubling in size",
            "Increased blood flow",
            "Hormones affecting digestion"
        ],
        symptoms: [
            "Nausea and vomiting peak",
            "Excessive saliva",
            "Heartburn",
            "Constipation",
            "Emotional changes"
        ],
        tipsAndAdvice: [
            "Eat bland, easy-to-digest foods",
            "Try vitamin B6 for nausea relief",
            "Avoid lying down after meals",
            "Join pregnancy support groups"
        ],
        icon: "🫐"
    },
    {
        week: 8,
        trimester: 1,
        babySize: "Raspberry",
        babyWeight: "1g",
        babyLength: "16 mm",
        babyDevelopment: [
            "Fingers and toes forming",
            "Eyelids and ears developing",
            "Baby begins to move spontaneously",
            "All essential organs present",
            "Bones starting to form"
        ],
        maternalChanges: [
            "Uterus size of a grapefruit",
            "Increased vaginal discharge",
            "Skin changes may begin"
        ],
        symptoms: [
            "Morning sickness continues",
            "Fatigue",
            "Heightened emotions",
            "Dizziness",
            "Food aversions"
        ],
        tipsAndAdvice: [
            "Stand up slowly to avoid dizziness",
            "Keep healthy snacks nearby",
            "Practice relaxation techniques",
            "Get adequate sleep"
        ],
        icon: "🍇"
    },
    {
        week: 9,
        trimester: 1,
        babySize: "Cherry",
        babyWeight: "2g",
        babyLength: "23 mm",
        babyDevelopment: [
            "You can hear baby's heartbeat on scan",
            "Baby's arms can bend at elbows",
            "Fingers and toes are more clear",
            "Baby's head is rounder now",
            "Baby's parts are forming"
        ],
        maternalChanges: [
            "Your waist may be getting bigger",
            "Your breasts are growing",
            "You can see veins more clearly"
        ],
        symptoms: [
            "Still feeling tired",
            "Mood changes",
            "Headaches",
            "Dizziness",
            "Stuffy nose"
        ],
        tipsAndAdvice: [
            "Use a humidifier if your nose is stuffy",
            "Drink plenty of water",
            "Take vitamins with food",
            "Rest and nap when you can"
        ],
        icon: "🍒",
        milestone: "Baby becomes a fetus now!"
    },
    {
        week: 10,
        trimester: 1,
        babySize: "Strawberry",
        babyWeight: "4g",
        babyLength: "31 mm",
        babyDevelopment: [
            "All vital organs formed",
            "Bones and cartilage forming",
            "Baby can make small movements",
            "Fingernails and hair beginning",
            "Baby swallowing amniotic fluid"
        ],
        maternalChanges: [
            "Ligaments stretching",
            "Increased appetite may begin",
            "Hormones stabilizing slightly"
        ],
        symptoms: [
            "Morning sickness may ease",
            "Round ligament pain",
            "Increased energy possible",
            "Heartburn",
            "Gas and bloating"
        ],
        tipsAndAdvice: [
            "Start maternity clothes shopping",
            "Continue healthy diet",
            "Stay active with pregnancy-safe exercises",
            "Schedule prenatal screenings"
        ],
        icon: "🍓"
    },
    {
        week: 11,
        trimester: 1,
        babySize: "Fig",
        babyWeight: "7g",
        babyLength: "41 mm",
        babyDevelopment: [
            "Baby's head comprises half of body",
            "Tooth buds appearing",
            "Skin still transparent",
            "Hands can form fists",
            "Baby can hiccup"
        ],
        maternalChanges: [
            "Uterus filling pelvis",
            "Increased thirst",
            "Metabolism speeding up"
        ],
        symptoms: [
            "Less nausea for many",
            "Increased vaginal discharge",
            "Darkening areolas",
            "Mild contractions possible"
        ],
        tipsAndAdvice: [
            "Stay hydrated throughout the day",
            "Use unscented products if sensitive",
            "Practice Kegel exercises",
            "Plan for second-trimester energy boost"
        ],
        icon: "🥭"
    },
    {
        week: 12,
        trimester: 1,
        babySize: "Lime",
        babyWeight: "14g",
        babyLength: "54 mm",
        babyDevelopment: [
            "Reflexes developing",
            "Baby can open and close fingers",
            "Intestines moving into abdomen",
            "Pituitary gland producing hormones",
            "Vocal cords forming"
        ],
        maternalChanges: [
            "Uterus rising above pubic bone",
            "Baby bump may be visible",
            "Skin may glow"
        ],
        symptoms: [
            "Morning sickness easing",
            "Increased energy",
            "Possible headaches",
            "Dizziness when standing"
        ],
        tipsAndAdvice: [
            "Consider announcing pregnancy",
            "Schedule NT scan if recommended",
            "Maintain iron-rich diet",
            "Stay active and hydrated"
        ],
        icon: "🍋",
        milestone: "End of first trimester!"
    },
    {
        week: 13,
        trimester: 2,
        babySize: "Peach",
        babyWeight: "23g",
        babyLength: "74 mm",
        babyDevelopment: [
            "Baby can suck thumb",
            "Fingerprints forming",
            "Urinating into amniotic fluid",
            "Voice box developing",
            "Head more proportional to body"
        ],
        maternalChanges: [
            "Energy levels improving",
            "Appetite increasing",
            "Morning sickness subsiding"
        ],
        symptoms: [
            "Visible baby bump",
            "Increased discharge",
            "Round ligament pain",
            "Decreased urination frequency"
        ],
        tipsAndAdvice: [
            "Enjoy increased energy",
            "Continue prenatal vitamins",
            "Start belly photos",
            "Plan maternity wardrobe"
        ],
        icon: "🍑",
        milestone: "Welcome to second trimester!"
    },
    {
        week: 14,
        trimester: 2,
        babySize: "Lemon",
        babyWeight: "43g",
        babyLength: "87 mm",
        babyDevelopment: [
            "Facial expressions developing",
            "Baby can squint and frown",
            "Thyroid gland producing hormones",
            "Kidneys producing urine",
            "Roof of mouth formed"
        ],
        maternalChanges: [
            "Uterus above pelvic bone",
            "Skin changes possible",
            "Increased blood volume"
        ],
        symptoms: [
            "Increased appetite",
            "More energy",
            "Possible constipation",
            "Forgetfulness (baby brain)"
        ],
        tipsAndAdvice: [
            "Eat fiber-rich foods",
            "Stay physically active",
            "Get enough sleep",
            "Consider prenatal yoga"
        ],
        icon: "🍋"
    },
    {
        week: 15,
        trimester: 2,
        babySize: "Apple",
        babyWeight: "70g",
        babyLength: "104 mm",
        babyDevelopment: [
            "Baby can sense light",
            "Legs longer than arms",
            "Bones hardening",
            "Hair pattern forming on scalp",
            "Baby moving actively"
        ],
        maternalChanges: [
            "Baby bump more obvious",
            "Skin stretching",
            "Increased blood circulation"
        ],
        symptoms: [
            "Nosebleeds possible",
            "Bleeding gums",
            "Increased appetite",
            "Vivid dreams"
        ],
        tipsAndAdvice: [
            "Use saline nose spray for congestion",
            "Soft toothbrush for gums",
            "Eat small, frequent meals",
            "Stay well-rested"
        ],
        icon: "🍎"
    },
    {
        week: 16,
        trimester: 2,
        babySize: "Avocado",
        babyWeight: "100g",
        babyLength: "116 mm",
        babyDevelopment: [
            "Facial muscles working",
            "Eyes can move",
            "Ears in final position",
            "Baby can hear sounds",
            "Strong bones developing"
        ],
        maternalChanges: [
            "Round ligaments stretching",
            "Possible quickening (feeling movement)",
            "Increased appetite"
        ],
        symptoms: [
            "Backache beginning",
            "Skin darkening (linea nigra)",
            "Possible first movements felt",
            "Increased energy"
        ],
        tipsAndAdvice: [
            "Talk and sing to baby",
            "Practice good posture",
            "Use pregnancy pillow",
            "Consider amniocentesis if recommended"
        ],
        icon: "🥑",
        milestone: "Baby can hear you!"
    },
    {
        week: 17,
        trimester: 2,
        babySize: "Turnip",
        babyWeight: "140g",
        babyLength: "130 mm",
        babyDevelopment: [
            "Baby gaining fat",
            "Sweat glands forming",
            "Practicing breathing movements",
            "Circulatory system functioning",
            "Umbilical cord stronger"
        ],
        maternalChanges: [
            "Uterus halfway to belly button",
            "Weight gain increasing",
            "Possible appetite surge"
        ],
        symptoms: [
            "Increased appetite",
            "Fetal movements",
            "Lower back pain",
            "Swollen feet"
        ],
        tipsAndAdvice: [
            "Elevate feet when resting",
            "Wear comfortable shoes",
            "Maintain healthy weight gain",
            "Stay hydrated"
        ],
        icon: "🥬"
    },
    {
        week: 18,
        trimester: 2,
        babySize: "Bell pepper",
        babyWeight: "190g",
        babyLength: "141 mm",
        babyDevelopment: [
            "Ears stand out from head",
            "Baby can yawn",
            "Nervous system maturing",
            "Myelin forming around nerves",
            "Genitals visible on ultrasound"
        ],
        maternalChanges: [
            "Baby movements more regular",
            "Increased energy levels",
            "Possible second ultrasound"
        ],
        symptoms: [
            "Feeling baby move (flutters)",
            "Dizziness",
            "Increased appetite",
            "Leg cramps"
        ],
        tipsAndAdvice: [
            "Schedule anatomy scan",
            "Stretch before bed for cramps",
            "Eat calcium and magnesium foods",
            "Bond with baby through movement"
        ],
        icon: "🫑"
    },
    {
        week: 19,
        trimester: 2,
        babySize: "Mango",
        babyWeight: "240g",
        babyLength: "152 mm",
        babyDevelopment: [
            "Vernix caseosa (protective coating) forming",
            "Sensory development accelerating",
            "Baby can taste amniotic fluid",
            "Arms and legs proportional",
            "Kidneys producing urine"
        ],
        maternalChanges: [
            "Baby bump clearly visible",
            "Skin stretching",
            "Possible stretch marks"
        ],
        symptoms: [
            "Leg cramps",
            "Back pain",
            "Increased vaginal discharge",
            "Dizziness"
        ],
        tipsAndAdvice: [
            "Use moisturizer for stretch marks",
            "Sleep on your side",
            "Stay active with prenatal exercises",
            "Consider prenatal massage"
        ],
        icon: "🥭"
    },
    {
        week: 20,
        trimester: 2,
        babySize: "Banana",
        babyWeight: "300g",
        babyLength: "166 mm",
        babyDevelopment: [
            "Baby is swallowing more",
            "Hair is growing on head",
            "Baby is moving a lot",
            "Baby sleeps and wakes at regular times",
            "Baby's skin has many layers now"
        ],
        maternalChanges: [
            "Your womb is at belly button level",
            "You're gaining weight steadily",
            "Baby movements are stronger"
        ],
        symptoms: [
            "You can feel baby move regularly",
            "Back pain",
            "Short of breath",
            "Hungry more often"
        ],
        tipsAndAdvice: [
            "Time for your detailed scan",
            "Start counting baby's movements",
            "Practice breathing exercises",
            "Stay hydrated and keep active"
        ],
        icon: "🍌",
        milestone: "You're halfway through!"
    },
    {
        week: 21,
        trimester: 2,
        babySize: "Carrot",
        babyWeight: "360g",
        babyLength: "267 mm",
        babyDevelopment: [
            "Baby can hear clearly",
            "Eyebrows and eyelids fully formed",
            "Bone marrow producing blood cells",
            "Digestive system practicing",
            "Baby gaining weight steadily"
        ],
        maternalChanges: [
            "Braxton Hicks contractions may begin",
            "Increased breast size",
            "Possible varicose veins"
        ],
        symptoms: [
            "Leg cramps at night",
            "Braxton Hicks contractions",
            "Increased appetite",
            "Possible heartburn"
        ],
        tipsAndAdvice: [
            "Elevate legs to prevent varicose veins",
            "Wear compression stockings if needed",
            "Practice relaxation for contractions",
            "Eat small, frequent meals"
        ],
        icon: "🥕"
    },
    {
        week: 22,
        trimester: 2,
        babySize: "Papaya",
        babyWeight: "430g",
        babyLength: "278 mm",
        babyDevelopment: [
            "Lips and eyelids more distinct",
            "Pancreas developing",
            "Baby can grasp umbilical cord",
            "Skin still wrinkled",
            "Touch receptors fully formed"
        ],
        maternalChanges: [
            "Increased body temperature",
            "Possible swelling in ankles",
            "Increased blood volume"
        ],
        symptoms: [
            "Hot flashes",
            "Swollen ankles and feet",
            "Increased libido possible",
            "Vivid dreams"
        ],
        tipsAndAdvice: [
            "Stay cool with loose clothing",
            "Reduce salt intake",
            "Elevate feet when possible",
            "Stay well-hydrated"
        ],
        icon: "🍈"
    },
    {
        week: 23,
        trimester: 2,
        babySize: "Grapefruit",
        babyWeight: "501g",
        babyLength: "288 mm",
        babyDevelopment: [
            "Lungs developing rapidly",
            "Baby practicing breathing",
            "Skin pigmentation beginning",
            "Blood vessels in lungs developing",
            "Baby can hear your heartbeat"
        ],
        maternalChanges: [
            "Uterus above belly button",
            "Possible glucose screening",
            "Increased breast size"
        ],
        symptoms: [
            "Swelling in hands and feet",
            "Backache",
            "Skin changes",
            "Increased appetite"
        ],
        tipsAndAdvice: [
            "Monitor blood sugar levels",
            "Wear supportive footwear",
            "Practice pelvic floor exercises",
            "Get adequate calcium"
        ],
        icon: "🍊"
    },
    {
        week: 24,
        trimester: 2,
        babySize: "Corn",
        babyWeight: "600g",
        babyLength: "300 mm",
        babyDevelopment: [
            "Baby's face almost fully formed",
            "Footprints and fingerprints formed",
            "Inner ear fully developed",
            "Baby gaining fat rapidly",
            "Lungs producing surfactant"
        ],
        maternalChanges: [
            "Possible sciatic nerve pain",
            "Increased blood circulation",
            "Possible carpal tunnel symptoms"
        ],
        symptoms: [
            "Sciatic pain",
            "Tingling in hands",
            "Increased energy",
            "Strong fetal movements"
        ],
        tipsAndAdvice: [
            "Stretch regularly for sciatic relief",
            "Shake hands to relieve tingling",
            "Start preparing nursery",
            "Consider childbirth classes"
        ],
        icon: "🌽",
        milestone: "Baby can survive with medical help if born!"
    },
    {
        week: 25,
        trimester: 3,
        babySize: "Cauliflower",
        babyWeight: "660g",
        babyLength: "346 mm",
        babyDevelopment: [
            "Baby's skin becoming less wrinkled",
            "Hair color and texture developing",
            "Nostrils opening",
            "Spine strengthening",
            "Blood vessels in lungs developing"
        ],
        maternalChanges: [
            "Increased blood pressure possible",
            "Hemorrhoids may develop",
            "Possible pelvic pressure"
        ],
        symptoms: [
            "Hemorrhoids",
            "Constipation",
            "Pelvic pressure",
            "Heartburn"
        ],
        tipsAndAdvice: [
            "Eat high-fiber foods",
            "Stay hydrated",
            "Use pregnancy-safe hemorrhoid cream",
            "Avoid long periods of standing"
        ],
        icon: "🥦"
    },
    {
        week: 26,
        trimester: 3,
        babySize: "Lettuce head",
        babyWeight: "760g",
        babyLength: "356 mm",
        babyDevelopment: [
            "Eyes beginning to open",
            "Baby responding to sounds",
            "Lungs developing air sacs",
            "Brain development accelerating",
            "Baby can recognize your voice"
        ],
        maternalChanges: [
            "Increased back pain",
            "Possible restless legs",
            "Increased breast size"
        ],
        symptoms: [
            "Back pain",
            "Restless leg syndrome",
            "Braxton Hicks contractions",
            "Swelling"
        ],
        tipsAndAdvice: [
            "Use pregnancy pillow for sleep",
            "Stretch before bed",
            "Monitor for preeclampsia signs",
            "Stay active with swimming"
        ],
        icon: "🥬"
    },
    {
        week: 27,
        trimester: 3,
        babySize: "Cauliflower",
        babyWeight: "875g",
        babyLength: "365 mm",
        babyDevelopment: [
            "Baby can open and close eyes",
            "Sleep cycles established",
            "Baby can suck thumb",
            "Lungs continue maturing",
            "Baby hearing more clearly"
        ],
        maternalChanges: [
            "More Braxton Hicks contractions",
            "Possible leg cramps",
            "Increased fatigue"
        ],
        symptoms: [
            "Frequent urination returns",
            "Leg cramps",
            "Fatigue",
            "Shortness of breath"
        ],
        tipsAndAdvice: [
            "Start third trimester preparations",
            "Practice breathing techniques",
            "Get adequate rest",
            "Monitor fetal movements"
        ],
        icon: "🥦",
        milestone: "End of second trimester!"
    },
    {
        week: 28,
        trimester: 3,
        babySize: "Eggplant",
        babyWeight: "1000g",
        babyLength: "375 mm",
        babyDevelopment: [
            "Baby can blink",
            "Dreaming may begin",
            "Billions of neurons in brain",
            "Eyelashes formed",
            "Baby adding fat layers"
        ],
        maternalChanges: [
            "Increased appetite",
            "More frequent prenatal visits",
            "Possible gestational diabetes screening"
        ],
        symptoms: [
            "Increased backache",
            "Shortness of breath",
            "Swelling in extremities",
            "Braxton Hicks"
        ],
        tipsAndAdvice: [
            "Start weekly movement counts",
            "Prepare hospital bag",
            "Tour birth facility",
            "Finalize birth plan"
        ],
        icon: "🍆",
        milestone: "Welcome to third trimester!"
    },
    {
        week: 29,
        trimester: 3,
        babySize: "Butternut squash",
        babyWeight: "1150g",
        babyLength: "385 mm",
        babyDevelopment: [
            "Bones fully developed (but soft)",
            "Baby can control temperature",
            "Eyes can focus",
            "Muscles and lungs maturing",
            "Baby gaining about 200g per week"
        ],
        maternalChanges: [
            "Increased fatigue",
            "More pelvic pressure",
            "Possible hemorrhoids worsening"
        ],
        symptoms: [
            "Fatigue",
            "Heartburn",
            "Constipation",
            "Shortness of breath"
        ],
        tipsAndAdvice: [
            "Sleep on left side",
            "Elevate head when sleeping",
            "Continue prenatal exercises",
            "Stay hydrated"
        ],
        icon: "🎃"
    },
    {
        week: 30,
        trimester: 3,
        babySize: "Cabbage",
        babyWeight: "1320g",
        babyLength: "395 mm",
        babyDevelopment: [
            "Baby growing rapidly",
            "Fat stores increasing",
            "Bone marrow producing red blood cells",
            "Lanugo (fine hair) starting to disappear",
            "Brain developing rapidly"
        ],
        maternalChanges: [
            "Increased clumsiness",
            "Possible carpal tunnel worsening",
            "Baby movements very noticeable"
        ],
        symptoms: [
            "Swelling in hands and feet",
            "Numbness in hands",
            "Frequent urination",
            "Backache"
        ],
        tipsAndAdvice: [
            "Be careful with balance",
            "Wear wrist splints if needed",
            "Practice labor positions",
            "Start perineal massage"
        ],
        icon: "🥬"
    },
    {
        week: 31,
        trimester: 3,
        babySize: "Coconut",
        babyWeight: "1500g",
        babyLength: "410 mm",
        babyDevelopment: [
            "All five senses working",
            "Baby processing information",
            "Rapid brain development",
            "Lungs almost fully developed",
            "Baby can turn head side to side"
        ],
        maternalChanges: [
            "Increased Braxton Hicks",
            "More difficulty sleeping",
            "Possible varicose veins"
        ],
        symptoms: [
            "Difficulty sleeping",
            "Increased discharge",
            "Braxton Hicks",
            "Shortness of breath"
        ],
        tipsAndAdvice: [
            "Use pregnancy pillow",
            "Avoid long standing periods",
            "Monitor discharge for changes",
            "Practice relaxation techniques"
        ],
        icon: "🥥"
    },
    {
        week: 32,
        trimester: 3,
        babySize: "Jicama",
        babyWeight: "1700g",
        babyLength: "425 mm",
        babyDevelopment: [
            "Baby practicing breathing",
            "Digestive system nearly complete",
            "Toenails and fingernails complete",
            "Baby sleeping 90% of the day",
            "Immune system developing"
        ],
        maternalChanges: [
            "Baby dropping lower (lightening may begin)",
            "More pelvic pressure",
            "Possible leaking colostrum"
        ],
        symptoms: [
            "Increased pelvic pressure",
            "Breast leakage",
            "Shortness of breath improving if baby drops",
            "Frequent urination"
        ],
        tipsAndAdvice: [
            "Use breast pads if leaking",
            "Prepare for maternity leave",
            "Install car seat",
            "Pack hospital bag"
        ],
        icon: "🥔"
    },
    {
        week: 33,
        trimester: 3,
        babySize: "Pineapple",
        babyWeight: "1920g",
        babyLength: "438 mm",
        babyDevelopment: [
            "Bones hardening",
            "Immune system strengthening",
            "Baby can detect light",
            "Pupils can dilate and contract",
            "Baby's head may engage in pelvis"
        ],
        maternalChanges: [
            "More Braxton Hicks contractions",
            "Increased pelvic pressure",
            "Possible heartburn relief if baby drops"
        ],
        symptoms: [
            "Pelvic pain",
            "Difficulty walking",
            "Increased fatigue",
            "Insomnia"
        ],
        tipsAndAdvice: [
            "Practice labor breathing",
            "Use pelvic support belt",
            "Continue prenatal appointments",
            "Rest frequently"
        ],
        icon: "🍍"
    },
    {
        week: 34,
        trimester: 3,
        babySize: "Cantaloupe",
        babyWeight: "2150g",
        babyLength: "450 mm",
        babyDevelopment: [
            "Central nervous system maturing",
            "Lungs nearly mature",
            "Vernix coating thickening",
            "Baby's fingernails reach fingertips",
            "Fat layers increasing"
        ],
        maternalChanges: [
            "Baby movements feel different (less space)",
            "More fatigue",
            "Increased discharge"
        ],
        symptoms: [
            "Fatigue",
            "Swelling",
            "Vision changes possible",
            "Frequent urination"
        ],
        tipsAndAdvice: [
            "Monitor vision changes",
            "Count fetal movements daily",
            "Prepare sibling if applicable",
            "Review birth plan"
        ],
        icon: "🍈"
    },
    {
        week: 35,
        trimester: 3,
        babySize: "Honeydew melon",
        babyWeight: "2380g",
        babyLength: "462 mm",
        babyDevelopment: [
            "Kidneys fully developed",
            "Liver processing waste",
            "Baby gaining 200g per week",
            "Lungs almost ready",
            "Most internal development complete"
        ],
        maternalChanges: [
            "Group B strep test scheduled",
            "Increased Braxton Hicks",
            "More difficulty moving"
        ],
        symptoms: [
            "Pelvic pressure",
            "Frequent urination",
            "Braxton Hicks",
            "Fatigue"
        ],
        tipsAndAdvice: [
            "Attend Group B strep screening",
            "Know signs of labor",
            "Prepare for baby's arrival",
            "Rest as much as possible"
        ],
        icon: "🍈"
    },
    {
        week: 36,
        trimester: 3,
        babySize: "Romaine lettuce",
        babyWeight: "2620g",
        babyLength: "474 mm",
        babyDevelopment: [
            "Baby shedding vernix and lanugo",
            "Gums firm and rigid",
            "Baby may be in head-down position",
            "Circulatory system complete",
            "Immune system continuing to develop"
        ],
        maternalChanges: [
            "Weekly prenatal visits begin",
            "Cervical checks may start",
            "More pelvic pressure"
        ],
        symptoms: [
            "Difficulty sleeping",
            "Frequent urination",
            "Pelvic pressure",
            "Braxton Hicks"
        ],
        tipsAndAdvice: [
            "Practice pain management techniques",
            "Monitor for labor signs",
            "Confirm hospital route and parking",
            "Have phone charged at all times"
        ],
        icon: "🥬",
        milestone: "Baby considered early term!"
    },
    {
        week: 37,
        trimester: 3,
        babySize: "Swiss chard",
        babyWeight: "2860g",
        babyLength: "485 mm",
        babyDevelopment: [
            "Baby considered full term",
            "Brain and lungs still maturing",
            "Baby can grasp firmly",
            "Practicing breathing movements",
            "May be engaged in pelvis"
        ],
        maternalChanges: [
            "Cervix may begin dilating",
            "Mucus plug may discharge",
            "More lightning crotch pain"
        ],
        symptoms: [
            "Lightning crotch pain",
            "Bloody show possible",
            "Increased pelvic pressure",
            "Nesting instinct"
        ],
        tipsAndAdvice: [
            "Know when to go to hospital",
            "Have bags packed",
            "Install car seat",
            "Rest and conserve energy"
        ],
        icon: "🥬",
        milestone: "Baby is full term!"
    },
    {
        week: 38,
        trimester: 3,
        babySize: "Leek",
        babyWeight: "3100g",
        babyLength: "495 mm",
        babyDevelopment: [
            "Baby gaining fat",
            "Organs fully mature",
            "Meconium building in intestines",
            "Baby's head may mold for birth",
            "Ready to be born"
        ],
        maternalChanges: [
            "Cervix ripening",
            "Possible water breaking",
            "Contractions may start"
        ],
        symptoms: [
            "Possible contractions",
            "Water may break",
            "Mucus plug loss",
            "Diarrhea possible"
        ],
        tipsAndAdvice: [
            "Monitor contraction timing",
            "Know labor signs",
            "Stay close to home",
            "Rest and eat well"
        ],
        icon: "🌿"
    },
    {
        week: 39,
        trimester: 3,
        babySize: "Mini watermelon",
        babyWeight: "3330g",
        babyLength: "505 mm",
        babyDevelopment: [
            "Baby fully developed",
            "Outer skin layer shedding",
            "Lungs producing more surfactant",
            "Brain still developing",
            "Baby ready for birth"
        ],
        maternalChanges: [
            "Cervix dilating and effacing",
            "Contractions may begin",
            "Possible water breaking"
        ],
        symptoms: [
            "Intense pelvic pressure",
            "Possible contractions",
            "Bloody show",
            "Water breaking"
        ],
        tipsAndAdvice: [
            "Time contractions",
            "Call doctor when contractions regular",
            "Stay hydrated",
            "Rest between contractions"
        ],
        icon: "🍉"
    },
    {
        week: 40,
        trimester: 3,
        babySize: "Small pumpkin",
        babyWeight: "3500g",
        babyLength: "515 mm",
        babyDevelopment: [
            "Baby fully ready for birth",
            "May have full head of hair or bald",
            "Reflexes fully coordinated",
            "Alert and responsive",
            "Perfect in every way"
        ],
        maternalChanges: [
            "Labor could start any time",
            "Cervix dilating",
            "Effacement progressing"
        ],
        symptoms: [
            "Labor contractions",
            "Water breaking",
            "Bloody show",
            "Back pain"
        ],
        tipsAndAdvice: [
            "Go to hospital when contractions 5-1-1",
            "Stay calm and breathe",
            "Trust your body",
            "Soon you'll meet your baby!"
        ],
        icon: "🎃",
        milestone: "Due date! Baby arriving soon!"
    }
];

/**
 * Get pregnancy data based on selected language
 */
export function getPregnancyDataByLanguage(language: 'en' | 'hi'): WeeklyPregnancyInfo[] {
    return language === 'hi' ? PREGNANCY_WEEKS_DATA_HI : PREGNANCY_WEEKS_DATA;
}

/**
 * Get pregnancy information for a specific week
 */
export function getPregnancyWeekInfo(week: number, language: 'en' | 'hi' = 'en'): WeeklyPregnancyInfo | undefined {
    const data = getPregnancyDataByLanguage(language);
    return data.find(d => d.week === week);
}

/**
 * Get all weeks for a specific trimester
 */
export function getWeeksByTrimester(trimester: 1 | 2 | 3, language: 'en' | 'hi' = 'en'): WeeklyPregnancyInfo[] {
    const data = getPregnancyDataByLanguage(language);
    return data.filter(d => d.trimester === trimester);
}
