/**
 * Pregnancy Calendar Utility
 * 
 * Calculates pregnancy weeks, days, trimester, due date, and provides
 * development milestones based on pregnancy start date (LMP - Last Menstrual Period).
 * 
 * Medical Standards:
 * - Pregnancy lasts approximately 280 days (40 weeks) from LMP
 * - Trimesters: 1st (weeks 1-13), 2nd (weeks 14-27), 3rd (weeks 28-40+)
 * - Full term: 37-42 weeks
 */

export interface PregnancyInfo {
    weeks: number;
    days: number;
    totalDays: number;
    trimester: 1 | 2 | 3;
    dueDate: Date;
    isFullTerm: boolean;
    daysUntilDue: number;
}

export interface BabyDevelopment {
    week: number;
    size_comparison: string; // e.g., "lemon", "avocado"
    length_cm: number;
    weight_g: number;
    milestones: string[];
}

/**
 * Calculate pregnancy weeks and days from start date (LMP)
 */
export function calculatePregnancyWeeks(startDate: Date): PregnancyInfo {
    const now = new Date();
    const start = new Date(startDate);

    // Calculate total days since LMP
    const totalDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate weeks and remaining days
    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;

    // Calculate trimester
    let trimester: 1 | 2 | 3;
    if (weeks <= 13) {
        trimester = 1;
    } else if (weeks <= 27) {
        trimester = 2;
    } else {
        trimester = 3;
    }

    // Calculate due date (280 days from LMP)
    const dueDate = new Date(start);
    dueDate.setDate(dueDate.getDate() + 280);

    // Days until due date
    const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Full term check (37-42 weeks)
    const isFullTerm = weeks >= 37 && weeks <= 42;

    return {
        days,
        daysUntilDue,
        dueDate,
        isFullTerm,
        totalDays,
        trimester,
        weeks,
    };
}

/**
 * Get baby development information for a specific week
 */
export function getBabyDevelopment(week: number): BabyDevelopment {
    const developments: Record<number, BabyDevelopment> = {
        4: {
            length_cm: 0.2,
            milestones: ["Neural tube forming", "Heart beginning to develop"],
            size_comparison: "poppy seed",
            week: 4,
            weight_g: 0.5,
        },
        8: {
            length_cm: 1.6,
            milestones: ["Webbed fingers and toes", "Eyelids forming", "Taste buds developing"],
            size_comparison: "kidney bean",
            week: 8,
            weight_g: 1,
        },
        12: {
            length_cm: 5.4,
            milestones: ["Reflexes developing", "Kidneys producing urine", "Fingernails forming"],
            size_comparison: "lime",
            week: 12,
            weight_g: 14,
        },
        16: {
            length_cm: 11.6,
            milestones: ["Eyes can move", "Ears in position", "Skeleton hardening"],
            size_comparison: "avocado",
            week: 16,
            weight_g: 100,
        },
        20: {
            length_cm: 25.6,
            milestones: ["Can hear sounds", "Hair growing", "Vernix forming"],
            size_comparison: "banana",
            week: 20,
            weight_g: 300,
        },
        24: {
            length_cm: 30,
            milestones: ["Lungs developing", "Taste buds mature", "Sleep-wake cycle"],
            size_comparison: "corn",
            week: 24,
            weight_g: 600,
        },
        28: {
            length_cm: 37.6,
            milestones: ["Eyes can open", "Brain rapidly developing", "Can respond to sound"],
            size_comparison: "eggplant",
            week: 28,
            weight_g: 1000,
        },
        32: {
            length_cm: 42.4,
            milestones: ["Bones fully formed", "Gaining weight", "Practicing breathing"],
            size_comparison: "squash",
            week: 32,
            weight_g: 1700,
        },
        36: {
            length_cm: 47.4,
            milestones: ["Fully developed", "Head positioned down", "Ready for birth soon"],
            size_comparison: "romaine lettuce",
            week: 36,
            weight_g: 2600,
        },
        40: {
            length_cm: 51.2,
            milestones: ["Full term", "All organs mature", "Ready for birth"],
            size_comparison: "watermelon",
            week: 40,
            weight_g: 3400,
        },
    };

    // Find closest week with data
    const availableWeeks = Object.keys(developments).map(Number).sort((a, b) => a - b);
    const closestWeek = availableWeeks.reduce((prev, curr) =>
        Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev
    );

    return developments[closestWeek] || developments[40];
}

/**
 * Get nutrition requirements by trimester
 * Based on ACOG and medical guidelines
 */
export interface NutritionRequirements {
    trimester: 1 | 2 | 3;
    calories_extra: number;
    protein_g: number;
    iron_mg: number;
    calcium_mg: number;
    folic_acid_mcg: number;
    vitamin_d_iu: number;
    dha_mg: number;
    water_ml: number;
    fiber_g: number;
}

export function getNutritionRequirements(trimester: 1 | 2 | 3): NutritionRequirements {
    const requirements: Record<number, NutritionRequirements> = {
        1: {
            calcium_mg: 1000,
            calories_extra: 0, // No extra calories needed in first trimester
            dha_mg: 200,
            fiber_g: 28,
            folic_acid_mcg: 600,
            iron_mg: 27,
            protein_g: 71,
            trimester: 1,
            vitamin_d_iu: 600,
            water_ml: 2300,
        },
        2: {
            calcium_mg: 1000,
            calories_extra: 340, // Additional calories per day
            dha_mg: 200,
            fiber_g: 28,
            folic_acid_mcg: 600,
            iron_mg: 27,
            protein_g: 71,
            trimester: 2,
            vitamin_d_iu: 600,
            water_ml: 2300,
        },
        3: {
            calcium_mg: 1000,
            calories_extra: 450, // Additional calories per day
            dha_mg: 200,
            fiber_g: 28,
            folic_acid_mcg: 600,
            iron_mg: 27,
            protein_g: 71,
            trimester: 3,
            vitamin_d_iu: 600,
            water_ml: 2300,
        },
    };

    return requirements[trimester];
}

/**
 * Get weekly tips for pregnant mothers
 */
export function getWeeklyTips(week: number): string[] {
    const tipsByWeek: Record<number, string[]> = {
        4: [
            "Start taking prenatal vitamins with folic acid",
            "Avoid alcohol, smoking, and certain medications",
            "Schedule your first prenatal appointment",
        ],
        8: [
            "Morning sickness may peak this week",
            "Stay hydrated and eat small, frequent meals",
            "Rest when you feel tired",
        ],
        12: [
            "First trimester screening available",
            "Energy levels may start to improve",
            "Continue prenatal vitamins",
        ],
        16: [
            "You may start to feel baby movements soon",
            "Second trimester energy boost common",
            "Maintain balanced diet with extra calories",
        ],
        20: [
            "Anatomy scan ultrasound this week",
            "Baby can hear your voice now",
            "Start pelvic floor exercises",
        ],
        24: [
            "Glucose screening test recommended",
            "Watch for signs of preeclampsia",
            "Stay active with pregnancy-safe exercises",
        ],
        28: [
            "Third trimester begins",
            "Braxton Hicks contractions may start",
            "Discuss birth plan with healthcare provider",
        ],
        32: [
            "Baby gaining weight rapidly",
            "Practice breathing techniques",
            "Pack hospital bag soon",
        ],
        36: [
            "Weekly prenatal visits begin",
            "Baby should be head-down",
            "Prepare for labor and delivery",
        ],
        40: [
            "Full term - baby could arrive any day",
            "Watch for signs of labor",
            "Stay calm and rest when possible",
        ],
    };

    // Find closest week
    const availableWeeks = Object.keys(tipsByWeek).map(Number).sort((a, b) => a - b);
    const closestWeek = availableWeeks.reduce((prev, curr) =>
        Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev
    );

    return tipsByWeek[closestWeek] || tipsByWeek[40];
}

/**
 * Format pregnancy progress as readable string
 */
export function formatPregnancyProgress(info: PregnancyInfo): string {
    return `Week ${info.weeks}`;
}

/**
 * Format pregnancy progress with days for calendar view
 */
export function formatPregnancyProgressWithDays(info: PregnancyInfo): string {
    return `Week ${info.weeks}, Day ${info.days}`;
}

/**
 * Calculate percentage of pregnancy completed
 */
export function getPregnancyProgress(weeks: number): number {
    return Math.min((weeks / 40) * 100, 100);
}
