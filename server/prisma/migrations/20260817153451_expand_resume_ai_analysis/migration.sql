-- AlterTable
ALTER TABLE "ResumeAnalysis" ADD COLUMN     "achievements" JSONB,
ADD COLUMN     "atsAnalysis" JSONB,
ADD COLUMN     "careerSuggestions" JSONB,
ADD COLUMN     "certifications" JSONB,
ADD COLUMN     "keywords" JSONB,
ADD COLUMN     "personalInfo" JSONB,
ADD COLUMN     "professionalSummary" TEXT,
ADD COLUMN     "recommendations" JSONB,
ADD COLUMN     "softSkills" JSONB,
ADD COLUMN     "strengths" JSONB,
ADD COLUMN     "weaknesses" JSONB;
