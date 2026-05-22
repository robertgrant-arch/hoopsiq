# HoopsIQ: Production-Grade Prisma Schema & Data Architecture

This document serves as the canonical data architecture for HoopsIQ, translating the modular monolith architecture and route map into a comprehensive, production-ready `schema.prisma`. It covers identity, multi-tenancy (orgs/teams), complex billing entitlements (the 50%-off athlete engine), content/gamification, video/AI, and auditing.

## 1. Complete `schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// 1. IDENTITY & USERS
// ==========================================

enum Role {
  ATHLETE
  COACH
  ASSISTANT_COACH
  TRAINER
  TEAM_ADMIN
  ORG_ADMIN
  PARENT
  EXPERT
  SUPER_ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

model User {
  id            String     @id @default(cuid())
  email         String     @unique
  clerkId       String     @unique // Identity provider ID
  role          Role       @default(ATHLETE)
  status        UserStatus @default(ACTIVE)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  deletedAt     DateTime?  // Soft delete

  // Profiles
  athleteProfile AthleteProfile?
  coachProfile   CoachProfile?
  expertProfile  ExpertProfile?
  parentProfile  ParentProfile?

  // Relations
  memberships         TeamMembership[]
  parentLinks         ParentLink[]       @relation("ParentToChild")
  childLinks          ParentLink[]       @relation("ChildToParent")
  invitationsSent     Invitation[]       @relation("Inviter")
  invitationsReceived Invitation[]       @relation("Invitee")
  stripeCustomer      StripeCustomer?
  subscriptions       Subscription[]
  entitlements        Entitlement[]
  videoUploads        VideoUpload[]
  messagesSent        Message[]
  messageParticipants MessageParticipant[]
  auditLogs           AuditLog[]
  notifications       Notification[]
  notificationPrefs   NotificationPreference?
}

model AthleteProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  firstName String
  lastName  String
  avatarUrl String?
  birthDate DateTime?
  heightCm  Int?
  weightKg  Int?
  position  String?
  
  // Gamification & Progression
  xp        Int      @default(0)
  levelId   String?
  level     Level?   @relation(fields: [levelId], references: [id])
  streak    Int      @default(0)
  
  // Relations
  completions       WorkoutCompletion[]
  achievements      AchievementUnlock[]
  skillRatings      SkillRating[]
  milestones        Milestone[]
  courseEnrollments CourseEnrollment[]
  quizAttempts      QuizAttempt[]
  filmQuizAttempts  FilmQuizAttempt[]
  bookings          Booking[]
  registrations     Registration[]
  xpEvents          XPEvent[]

  @@index([xp(sort: Desc)])
}

model CoachProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  firstName   String
  lastName    String
  avatarUrl   String?
  bio         String?
  experience  String?
  
  // Relations
  reviewsGiven CoachReview[]
  playbooks    Playbook[]
}

model ExpertProfile {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  firstName     String
  lastName      String
  avatarUrl     String?
  bio           String?
  credentials   String?
  isPublic      Boolean  @default(false)
  
  // Relations
  stripeConnect StripeConnectAccount?
  courses       Course[]
  liveEvents    LiveEvent[]
  availabilities Availability[]
  expertReviews ExpertReview[]
}

model ParentProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  firstName String
  lastName  String
  phone     String?
}

model ParentLink {
  id        String   @id @default(cuid())
  parentId  String
  childId   String
  parent    User     @relation("ParentToChild", fields: [parentId], references: [id], onDelete: Cascade)
  child     User     @relation("ChildToParent", fields: [childId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([parentId, childId])
}

// ==========================================
// 2. ORGANIZATIONS & TEAMS
// ==========================================

model Organization {
  id        String   @id @default(cuid())
  name      String
  logoUrl   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  teams     Team[]
}

model Team {
  id             String         @id @default(cuid())
  orgId          String?
  org            Organization?  @relation(fields: [orgId], references: [id])
  name           String
  logoUrl        String?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  
  // Relations
  seasons        Season[]
  memberships    TeamMembership[]
  invitations    Invitation[]
  discountRules  DiscountRule[] // For the 50% off engine
  filmRooms      FilmRoom[]
  playbooks      Playbook[]     // Team-specific playbooks
}

model Season {
  id        String   @id @default(cuid())
  teamId    String
  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  name      String   // e.g., "2024-2025 Varsity"
  startDate DateTime
  endDate   DateTime
  isActive  Boolean  @default(true)
}

model TeamMembership {
  id        String   @id @default(cuid())
  teamId    String
  userId    String
  role      Role     // Role specifically within this team
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@index([userId])
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
}

model Invitation {
  id          String           @id @default(cuid())
  token       String           @unique
  email       String
  teamId      String?
  team        Team?            @relation(fields: [teamId], references: [id])
  role        Role
  inviterId   String
  inviter     User             @relation("Inviter", fields: [inviterId], references: [id])
  inviteeId   String?
  invitee     User?            @relation("Invitee", fields: [inviteeId], references: [id])
  status      InvitationStatus @default(PENDING)
  expiresAt   DateTime
  createdAt   DateTime         @default(now())
}

// ==========================================
// 3. BILLING, STRIPE & ENTITLEMENTS
// ==========================================

model StripeCustomer {
  id               String   @id @default(cuid())
  userId           String   @unique
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeCustomerId String   @unique
  createdAt        DateTime @default(now())
}

model StripeConnectAccount {
  id              String        @id @default(cuid())
  expertProfileId String        @unique
  expert          ExpertProfile @relation(fields: [expertProfileId], references: [id], onDelete: Cascade)
  stripeAccountId String        @unique
  chargesEnabled  Boolean       @default(false)
  payoutsEnabled  Boolean       @default(false)
  payouts         Payout[]
}

model Plan {
  id            String         @id @default(cuid())
  name          String         // e.g., "Athlete Pro", "Team Standard"
  stripePriceId String         @unique
  interval      String         // "month", "year"
  features      Feature[]
  subscriptions Subscription[]
}

model Feature {
  id          String   @id @default(cuid())
  key         String   @unique // e.g., "AI_ANALYSIS_UNLIMITED"
  description String
  plans       Plan[]
}

enum SubStatus {
  ACTIVE
  CANCELED
  PAST_DUE
  UNPAID
}

model Subscription {
  id                   String    @id @default(cuid())
  userId               String
  user                 User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  planId               String
  plan                 Plan      @relation(fields: [planId], references: [id])
  stripeSubscriptionId String    @unique
  status               SubStatus
  currentPeriodEnd     DateTime
  cancelAtPeriodEnd    Boolean   @default(false)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
}

// The 50%-off team-linked athlete engine
model DiscountRule {
  id              String          @id @default(cuid())
  teamId          String
  team            Team            @relation(fields: [teamId], references: [id], onDelete: Cascade)
  stripeCouponId  String          // The Stripe coupon to apply (e.g., 50% off)
  isActive        Boolean         @default(true)
  grants          DiscountGrant[]
}

model DiscountGrant {
  id             String       @id @default(cuid())
  discountRuleId String
  discountRule   DiscountRule @relation(fields: [discountRuleId], references: [id], onDelete: Cascade)
  athleteId      String
  // Relation mapped to Entitlement below for generic tracking
  stripeDiscountId String?    // ID of the discount applied in Stripe
  status         String       // ACTIVE, REVOKED
  createdAt      DateTime     @default(now())
  revokedAt      DateTime?
}

model Entitlement {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String   // e.g., "TEAM_DISCOUNT_50"
  sourceId  String   // ID of the DiscountGrant or other source
  expiresAt DateTime?
  createdAt DateTime @default(now())

  @@unique([userId, type, sourceId])
}

model Payout {
  id              String               @id @default(cuid())
  connectAccountId String
  connectAccount  StripeConnectAccount @relation(fields: [connectAccountId], references: [id])
  amount          Int                  // In cents
  currency        String               @default("usd")
  status          String               // PENDING, PAID, FAILED
  stripePayoutId  String               @unique
  createdAt       DateTime             @default(now())
}

model Invoice {
  id              String   @id @default(cuid())
  stripeInvoiceId String   @unique
  amountDue       Int
  amountPaid      Int
  status          String
  createdAt       DateTime @default(now())
}

model Charge {
  id             String   @id @default(cuid())
  stripeChargeId String   @unique
  amount         Int
  status         String
  createdAt      DateTime @default(now())
}

// ==========================================
// 4. WORKOUTS, DRILLS & PROGRESSION
// ==========================================

model WorkoutTemplate {
  id          String    @id @default(cuid())
  title       String
  description String?
  isWod       Boolean   @default(false)
  difficulty  String?   // BEGINNER, INTERMEDIATE, ADVANCED
  workouts    Workout[]
}

model Workout {
  id          String            @id @default(cuid())
  templateId  String?
  template    WorkoutTemplate?  @relation(fields: [templateId], references: [id])
  title       String
  scheduledFor DateTime?        // If it's a WOD
  drills      Drill[]
  assignments WorkoutAssignment[]
  completions WorkoutCompletion[]
  sessions    WorkoutSession[]
}

model DrillCategory {
  id     String  @id @default(cuid())
  name   String  @unique // e.g., "Shooting", "Ball Handling"
  drills Drill[]
}

model Drill {
  id          String        @id @default(cuid())
  categoryId  String
  category    DrillCategory @relation(fields: [categoryId], references: [id])
  workoutId   String?
  workout     Workout?      @relation(fields: [workoutId], references: [id])
  title       String
  description String?
  videoUrl    String?       // Mux Asset URL for demonstration
  xpReward    Int           @default(10)
  durationSec Int?
}

model WorkoutAssignment {
  id        String   @id @default(cuid())
  workoutId String
  workout   Workout  @relation(fields: [workoutId], references: [id])
  athleteId String
  assignerId String? // Coach who assigned it
  dueDate   DateTime?
  status    String   // PENDING, COMPLETED
  createdAt DateTime @default(now())
}

model WorkoutSession {
  id          String    @id @default(cuid())
  workoutId   String
  workout     Workout   @relation(fields: [workoutId], references: [id])
  athleteId   String
  startedAt   DateTime  @default(now())
  endedAt     DateTime?
  metrics     Json?     // e.g., { shotsMade: 45, shotsAttempted: 50 }
}

model WorkoutCompletion {
  id               String         @id @default(cuid())
  workoutId        String
  workout          Workout        @relation(fields: [workoutId], references: [id])
  athleteProfileId String
  athlete          AthleteProfile @relation(fields: [athleteProfileId], references: [id], onDelete: Cascade)
  completedAt      DateTime       @default(now())
  xpEarned         Int
  
  @@unique([workoutId, athleteProfileId, completedAt])
}

model SkillTrack {
  id          String        @id @default(cuid())
  name        String        // e.g., "Elite Point Guard"
  description String?
  ratings     SkillRating[]
}

// ==========================================
// 5. VIDEO & AI ANALYSIS
// ==========================================

enum VideoStatus {
  UPLOADING
  PROCESSING
  READY
  FAILED
}

enum PrivacyScope {
  PRIVATE
  TEAM
  PUBLIC
}

model VideoUpload {
  id          String        @id @default(cuid())
  uploaderId  String
  uploader    User          @relation(fields: [uploaderId], references: [id], onDelete: Cascade)
  muxAssetId  String?       @unique
  muxPlaybackId String?
  status      VideoStatus   @default(UPLOADING)
  privacy     PrivacyScope  @default(PRIVATE)
  title       String?
  durationSec Float?
  createdAt   DateTime      @default(now())
  
  // Relations
  aiAnalysis  AIAnalysis?
  coachReviews CoachReview[]
  expertReviews ExpertReview[]
  filmClips   FilmClip[]
}

model AIAnalysis {
  id          String        @id @default(cuid())
  videoId     String        @unique
  video       VideoUpload   @relation(fields: [videoId], references: [id], onDelete: Cascade)
  status      String        // PENDING, COMPLETED, FAILED
  confidence  Float?        // Overall AI confidence score
  rawMetrics  Json?         // Pose estimation data, angles
  createdAt   DateTime      @default(now())
  
  issues      AIAnalysisIssue[]
}

model AIAnalysisIssue {
  id           String     @id @default(cuid())
  analysisId   String
  analysis     AIAnalysis @relation(fields: [analysisId], references: [id], onDelete: Cascade)
  timestampSec Float      // When in the video the issue occurs
  issueType    String     // e.g., "ELBOW_FLARED", "STANCE_TOO_NARROW"
  description  String
  suggestedDrillId String? // Link to a corrective drill
}

model CoachReview {
  id          String       @id @default(cuid())
  videoId     String
  video       VideoUpload  @relation(fields: [videoId], references: [id], onDelete: Cascade)
  coachId     String
  coach       CoachProfile @relation(fields: [coachId], references: [id], onDelete: Cascade)
  status      String       // DRAFT, PUBLISHED
  comments    Json         // Array of { timestampSec, text, drawings }
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model ExpertReview {
  id          String        @id @default(cuid())
  videoId     String
  video       VideoUpload   @relation(fields: [videoId], references: [id], onDelete: Cascade)
  expertId    String
  expert      ExpertProfile @relation(fields: [expertId], references: [id], onDelete: Cascade)
  bookingId   String?       @unique // Link to the paid booking
  comments    Json
  createdAt   DateTime      @default(now())
}

// ==========================================
// 6. COURSES & LEARNING
// ==========================================

model Bundle {
  id          String   @id @default(cuid())
  title       String
  price       Int      // In cents
  courses     Course[]
}

model Course {
  id          String        @id @default(cuid())
  expertId    String
  expert      ExpertProfile @relation(fields: [expertId], references: [id], onDelete: Cascade)
  bundleId    String?
  bundle      Bundle?       @relation(fields: [bundleId], references: [id])
  title       String
  description String?
  price       Int?          // If sold individually
  isPublished Boolean       @default(false)
  
  modules     Module[]
  enrollments CourseEnrollment[]
}

model Module {
  id       String   @id @default(cuid())
  courseId String
  course   Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title    String
  order    Int
  lessons  Lesson[]
}

model Lesson {
  id          String   @id @default(cuid())
  moduleId    String
  module      Module   @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  title       String
  videoUrl    String?
  content     String?  // Markdown/Rich text
  order       Int
  
  progress    LessonProgress[]
}

model CourseEnrollment {
  id               String         @id @default(cuid())
  courseId         String
  course           Course         @relation(fields: [courseId], references: [id], onDelete: Cascade)
  athleteProfileId String
  athlete          AthleteProfile @relation(fields: [athleteProfileId], references: [id], onDelete: Cascade)
  enrolledAt       DateTime       @default(now())
  
  @@unique([courseId, athleteProfileId])
}

model LessonProgress {
  id          String   @id @default(cuid())
  lessonId    String
  lesson      Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  userId      String   // Can be athlete or coach
  isCompleted Boolean  @default(false)
  lastPositionSec Int?
  updatedAt   DateTime @updatedAt

  @@unique([lessonId, userId])
}

// ==========================================
// 7. BOOKINGS & LIVE EVENTS
// ==========================================

enum BookingType {
  ONE_ON_ONE
  FILM_REVIEW
}

enum BookingStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELED
}

model Availability {
  id          String        @id @default(cuid())
  expertId    String
  expert      ExpertProfile @relation(fields: [expertId], references: [id], onDelete: Cascade)
  startTime   DateTime
  endTime     DateTime
  isBooked    Boolean       @default(false)
}

model Booking {
  id               String         @id @default(cuid())
  expertId         String
  athleteProfileId String
  athlete          AthleteProfile @relation(fields: [athleteProfileId], references: [id], onDelete: Cascade)
  type             BookingType
  status           BookingStatus  @default(PENDING)
  startTime        DateTime
  endTime          DateTime
  pricePaid        Int            // In cents
  stripeChargeId   String?
  createdAt        DateTime       @default(now())
}

enum EventStatus {
  SCHEDULED
  LIVE
  COMPLETED
  CANCELED
}

model LiveEvent {
  id          String        @id @default(cuid())
  expertId    String
  expert      ExpertProfile @relation(fields: [expertId], references: [id], onDelete: Cascade)
  title       String
  description String?
  scheduledFor DateTime
  status      EventStatus   @default(SCHEDULED)
  roomId      String?       @unique // LiveKit/Daily room ID
  price       Int?          // 0 or null for free
  
  registrations Registration[]
  replayAsset   ReplayAsset?
}

model Registration {
  id               String         @id @default(cuid())
  eventId          String
  event            LiveEvent      @relation(fields: [eventId], references: [id], onDelete: Cascade)
  athleteProfileId String
  athlete          AthleteProfile @relation(fields: [athleteProfileId], references: [id], onDelete: Cascade)
  registeredAt     DateTime       @default(now())
  hasAttended      Boolean        @default(false)

  @@unique([eventId, athleteProfileId])
}

model ReplayAsset {
  id          String    @id @default(cuid())
  eventId     String    @unique
  event       LiveEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  muxAssetId  String
  durationSec Int?
}

// ==========================================
// 8. PLAYBOOKS & FILM ROOMS
// ==========================================

model Playbook {
  id          String       @id @default(cuid())
  teamId      String?
  team        Team?        @relation(fields: [teamId], references: [id], onDelete: Cascade)
  coachId     String?
  coach       CoachProfile? @relation(fields: [coachId], references: [id], onDelete: Cascade)
  title       String
  plays       Play[]
  quizzes     PlayQuiz[]
}

model Play {
  id          String    @id @default(cuid())
  playbookId  String
  playbook    Playbook  @relation(fields: [playbookId], references: [id], onDelete: Cascade)
  title       String
  description String?
  phases      PlayPhase[]
}

model PlayPhase {
  id          String    @id @default(cuid())
  playId      String
  play        Play      @relation(fields: [playId], references: [id], onDelete: Cascade)
  order       Int
  diagram     PlayDiagram?
}

model PlayDiagram {
  id          String    @id @default(cuid())
  phaseId     String    @unique
  phase       PlayPhase @relation(fields: [phaseId], references: [id], onDelete: Cascade)
  data        Json      // Canvas/SVG animation data
}

model PlayQuiz {
  id          String    @id @default(cuid())
  playbookId  String
  playbook    Playbook  @relation(fields: [playbookId], references: [id], onDelete: Cascade)
  title       String
  questions   QuizQuestion[]
}

model QuizQuestion {
  id          String    @id @default(cuid())
  quizId      String
  quiz        PlayQuiz  @relation(fields: [quizId], references: [id], onDelete: Cascade)
  question    String
  options     Json      // Array of strings
  correctIdx  Int
}

model QuizAttempt {
  id               String         @id @default(cuid())
  quizId           String
  athleteProfileId String
  athlete          AthleteProfile @relation(fields: [athleteProfileId], references: [id], onDelete: Cascade)
  score            Int
  passed           Boolean
  createdAt        DateTime       @default(now())
}

model FilmRoom {
  id          String   @id @default(cuid())
  teamId      String
  team        Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  name        String
  clips       FilmClip[]
  assignments FilmAssignment[]
}

model FilmClip {
  id          String      @id @default(cuid())
  filmRoomId  String
  filmRoom    FilmRoom    @relation(fields: [filmRoomId], references: [id], onDelete: Cascade)
  videoId     String
  video       VideoUpload @relation(fields: [videoId], references: [id])
  title       String
  startTimeSec Float?
  endTimeSec   Float?
  annotations TelestrationAnnotation[]
}

model TelestrationAnnotation {
  id          String   @id @default(cuid())
  clipId      String
  clip        FilmClip @relation(fields: [clipId], references: [id], onDelete: Cascade)
  timestampSec Float
  data        Json     // Drawing coordinates, text
}

model FilmAssignment {
  id          String   @id @default(cuid())
  filmRoomId  String
  filmRoom    FilmRoom @relation(fields: [filmRoomId], references: [id], onDelete: Cascade)
  title       String
  dueDate     DateTime?
  watchEvents FilmWatchEvent[]
  quiz        FilmQuiz?
}

model FilmWatchEvent {
  id           String         @id @default(cuid())
  assignmentId String
  assignment   FilmAssignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  userId       String
  watchedSec   Int
  completed    Boolean        @default(false)
  updatedAt    DateTime       @updatedAt

  @@unique([assignmentId, userId])
}

model FilmQuiz {
  id           String         @id @default(cuid())
  assignmentId String         @unique
  assignment   FilmAssignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  questions    Json           // Array of { q, options, correctIdx }
  attempts     FilmQuizAttempt[]
}

model FilmQuizAttempt {
  id               String         @id @default(cuid())
  filmQuizId       String
  filmQuiz         FilmQuiz       @relation(fields: [filmQuizId], references: [id], onDelete: Cascade)
  athleteProfileId String
  athlete          AthleteProfile @relation(fields: [athleteProfileId], references: [id], onDelete: Cascade)
  score            Int
  createdAt        DateTime       @default(now())
}

// ==========================================
// 9. GAMIFICATION
// ==========================================

model XPEvent {
  id               String         @id @default(cuid())
  athleteProfileId String
  athlete          AthleteProfile @relation(fields: [athleteProfileId], references: [id], onDelete: Cascade)
  amount           Int
  source           String         // e.g., "WOD_COMPLETION", "FILM_WATCHED"
  createdAt        DateTime       @default(now())
}

model Level {
  id          String           @id @default(cuid())
  number      Int              @unique
  xpRequired  Int
  title       String           // e.g., "Rookie", "All-Star"
  athletes    AthleteProfile[]
}

model Streak {
  id               String   @id @default(cuid())
  athleteProfileId String   @unique
  currentStreak    Int      @default(0)
  longestStreak    Int      @default(0)
  lastActiveDate   DateTime @db.Date
}

model Achievement {
  id          String              @id @default(cuid())
  name        String
  description String
  iconUrl     String?
  unlocks     AchievementUnlock[]
}

model AchievementUnlock {
  id               String         @id @default(cuid())
  achievementId    String
  achievement      Achievement    @relation(fields: [achievementId], references: [id], onDelete: Cascade)
  athleteProfileId String
  athlete          AthleteProfile @relation(fields: [athleteProfileId], references: [id], onDelete: Cascade)
  unlockedAt       DateTime       @default(now())

  @@unique([achievementId, athleteProfileId])
}

model SkillRating {
  id               String         @id @default(cuid())
  athleteProfileId String
  athlete          AthleteProfile @relation(fields: [athleteProfileId], references: [id], onDelete: Cascade)
  skillTrackId     String
  skillTrack       SkillTrack     @relation(fields: [skillTrackId], references: [id], onDelete: Cascade)
  rating           Float          // 1.0 to 100.0
  updatedAt        DateTime       @updatedAt

  @@unique([athleteProfileId, skillTrackId])
}

model Milestone {
  id               String         @id @default(cuid())
  athleteProfileId String
  athlete          AthleteProfile @relation(fields: [athleteProfileId], references: [id], onDelete: Cascade)
  title            String
  achievedAt       DateTime       @default(now())
}

// ==========================================
// 10. NOTIFICATIONS & MESSAGING
// ==========================================

enum NotificationChannel {
  IN_APP
  EMAIL
  PUSH
}

model NotificationPreference {
  id          String  @id @default(cuid())
  userId      String  @unique
  user        User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  emailEnabled Boolean @default(true)
  pushEnabled  Boolean @default(true)
  inAppEnabled Boolean @default(true)
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
  body      String
  linkUrl   String?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}

model Thread {
  id           String               @id @default(cuid())
  title        String?
  participants MessageParticipant[]
  messages     Message[]
  updatedAt    DateTime             @updatedAt
}

model MessageParticipant {
  id       String @id @default(cuid())
  threadId String
  thread   Thread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  userId   String
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  lastRead DateTime?

  @@unique([threadId, userId])
}

model Message {
  id        String   @id @default(cuid())
  threadId  String
  thread    Thread   @relation(fields: [threadId], references: [id], onDelete: Cascade)
  senderId  String
  sender    User     @relation(fields: [senderId], references: [id], onDelete: Cascade)
  content   String
  createdAt DateTime @default(now())
}

// ==========================================
// 11. AUDIT & MODERATION
// ==========================================

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  action    String   // e.g., "TEAM_DELETED", "SUBSCRIPTION_CANCELED"
  entity    String   // e.g., "Team", "Subscription"
  entityId  String
  details   Json?
  createdAt DateTime @default(now())
}

model DomainEvent {
  id        String   @id @default(cuid())
  type      String   // e.g., "video.uploaded", "workout.completed"
  payload   Json
  status    String   // PENDING, PROCESSED, FAILED
  createdAt DateTime @default(now())
}

model FlaggedContent {
  id          String   @id @default(cuid())
  reporterId  String
  entityType  String   // e.g., "VideoUpload", "Message"
  entityId    String
  reason      String
  status      String   // OPEN, REVIEWED, RESOLVED
  createdAt   DateTime @default(now())
}

model ModerationAction {
  id          String   @id @default(cuid())
  adminId     String
  targetId    String   // User ID or Content ID
  action      String   // e.g., "SUSPEND_USER", "DELETE_VIDEO"
  reason      String
  createdAt   DateTime @default(now())
}
```

## 2. Cascade Rules & Soft-Delete Strategy

### Cascade Rules
*   **Identity & Profiles**: `onDelete: Cascade` is heavily used from `User` to their respective profiles (`AthleteProfile`, `CoachProfile`, etc.). If a user is hard-deleted (e.g., GDPR compliance), all PII and profiles are wiped.
*   **Team Data**: `onDelete: Cascade` is used from `Team` to `TeamMembership`, `Season`, `FilmRoom`, and `DiscountRule`. If an organization deletes a team, all associated team-specific structure is removed.
*   **Content & Gamification**: `onDelete: Cascade` is used from `AthleteProfile` to `WorkoutCompletion`, `AchievementUnlock`, and `XPEvent`.
*   **Audit Safety**: `onDelete: SetNull` is used on `AuditLog.userId`. If a user is deleted, their audit trail remains intact for compliance, but the `userId` reference is nullified.

### Soft-Delete Strategy
Instead of immediately hard-deleting users, HoopsIQ employs a soft-delete strategy via the `status` and `deletedAt` fields on the `User` model.
*   **Implementation**: When a user "deletes" their account, `status` becomes `DELETED` and `deletedAt` is set to `now()`.
*   **Middleware**: Prisma middleware (or Prisma Client Extensions) should be configured to automatically filter out records where `deletedAt != null` on all `findMany` and `findUnique` queries, unless explicitly requested by an admin.
*   **Data Retention**: A background cron job permanently purges soft-deleted users and their cascaded data after 30 days.

### Optimistic Concurrency
*   **Bookings**: When an athlete attempts to book an expert's `Availability`, optimistic concurrency control should be used. The query should `update` the availability where `isBooked: false`. If 0 records are updated, the slot was taken by another user milliseconds prior.
*   **XP/Streaks**: Gamification updates (like `xp` incrementing) should use atomic operations (`increment: { xp: reward }`) rather than read-modify-write to prevent race conditions during rapid event completion.

## 3. Recommended Indexes for Hot-Path Queries

1.  **Player Dashboard (WODs & XP)**
    *   `@@index([xp(sort: Desc)])` on `AthleteProfile` for rapid leaderboard generation.
    *   `@@unique([workoutId, athleteProfileId, completedAt])` on `WorkoutCompletion` to quickly check if today's WOD is done.
2.  **Coach Compliance View**
    *   `@@index([userId])` on `TeamMembership` to quickly load all teams an athlete belongs to.
    *   `@@unique([assignmentId, userId])` on `FilmWatchEvent` for O(1) lookups on whether an athlete watched the assigned film.
3.  **Marketplace Search**
    *   While not explicitly defined in Prisma (as full-text search is better suited for Elastic/Algolia), indexing `isPublic` on `ExpertProfile` is crucial for the public directory.
4.  **Billing & Entitlements**
    *   `@@unique([userId, type, sourceId])` on `Entitlement` to rapidly verify if an athlete holds the 50%-off discount before rendering the Stripe checkout.

## 4. Entitlement Resolution Logic (50%-Off Engine)

Below is a TypeScript service pseudocode demonstrating how the team-linked discount is triggered, verified, granted, applied, and revoked.

```typescript
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export class EntitlementService {
  /**
   * TRIGGER & VERIFICATION: Called when an athlete accepts a team invite.
   */
  static async evaluateTeamDiscount(athleteId: string, teamId: string) {
    // 1. Verify Team has an active subscription and a DiscountRule
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { discountRules: { where: { isActive: true } } }
    });

    if (!team || team.discountRules.length === 0) return;
    const rule = team.discountRules[0];

    // 2. GRANT: Create the DiscountGrant and generic Entitlement
    await prisma.$transaction(async (tx) => {
      const grant = await tx.discountGrant.create({
        data: { discountRuleId: rule.id, athleteId, status: "ACTIVE" }
      });

      await tx.entitlement.create({
        data: {
          userId: athleteId,
          type: "TEAM_DISCOUNT_50",
          sourceId: grant.id
        }
      });
    });
  }

  /**
   * CHECKOUT APPLICATION: Called before generating a Stripe Checkout session.
   */
  static async getCheckoutPrice(athleteId: string, basePriceId: string) {
    // 1. Check for active entitlement
    const entitlement = await prisma.entitlement.findFirst({
      where: { userId: athleteId, type: "TEAM_DISCOUNT_50" }
    });

    if (entitlement) {
      // 2. Fetch the Stripe Coupon ID from the source grant
      const grant = await prisma.discountGrant.findUnique({
        where: { id: entitlement.sourceId },
        include: { discountRule: true }
      });
      
      // Return the base price but attach the 50% off coupon to the checkout session
      return { priceId: basePriceId, couponId: grant?.discountRule.stripeCouponId };
    }

    return { priceId: basePriceId, couponId: null };
  }

  /**
   * REVOCATION: Called via webhook if Team sub cancels, or if athlete is removed from roster.
   */
  static async revokeTeamDiscount(athleteId: string, teamId: string) {
    // 1. Find the grant linked to this team
    const grant = await prisma.discountGrant.findFirst({
      where: { athleteId, discountRule: { teamId }, status: "ACTIVE" }
    });

    if (!grant) return;

    // 2. Mark revoked and delete entitlement
    await prisma.$transaction([
      prisma.discountGrant.update({
        where: { id: grant.id },
        data: { status: "REVOKED", revokedAt: new Date() }
      }),
      prisma.entitlement.deleteMany({
        where: { sourceId: grant.id, type: "TEAM_DISCOUNT_50" }
      })
    ]);

    // 3. Tell Stripe to remove the discount from the active customer subscription
    if (grant.stripeDiscountId) {
      const customer = await prisma.stripeCustomer.findUnique({ where: { userId: athleteId } });
      if (customer) {
        await stripe.customers.deleteDiscount(customer.stripeCustomerId);
      }
    }
  }
}
```

## 5. Migration Strategy & Seed Data

### Migrations
*   **Local/Dev**: Use `npx prisma migrate dev` to generate SQL files in `prisma/migrations/`.
*   **Production**: Use `npx prisma migrate deploy` during the CI/CD pipeline (e.g., GitHub Actions or Vercel build step).
*   **Data Migrations**: For complex schema changes (e.g., splitting a table), use empty migrations (`npx prisma migrate dev --create-only`) to write custom SQL or TypeScript scripts that move data safely before dropping old columns.

### Seed Approach (`prisma/seed.ts`)
The seed script should generate a realistic, interconnected environment:
1.  **Base Catalog**: Seed `DrillCategory`, `SkillTrack`, `Level`, `Achievement`, and `Plan` (with corresponding Stripe test IDs).
2.  **Super Admin**: Create one guaranteed `SUPER_ADMIN` account.
3.  **The "Golden Path" Scenario**:
    *   Create an `Organization` ("Elite Hoops Academy") and a `Team` ("Varsity Boys").
    *   Create a `CoachProfile` and assign them as `TEAM_ADMIN`.
    *   Create a `DiscountRule` for the team.
    *   Create 5 `AthleteProfile`s, add them to the `TeamMembership`, and trigger the `DiscountGrant` logic.
    *   Create a `Workout` and assign it to the team.
    *   Create an `ExpertProfile` with dummy `Availability` slots.

## 6. Scaling & Partitioning Concerns

As HoopsIQ grows, certain tables will become massive and require strategic handling:

1.  **`DomainEvent` & `AuditLog`**: These append-only tables will grow infinitely.
    *   *Strategy*: Implement table partitioning in PostgreSQL by date (e.g., monthly partitions). Archive partitions older than 6 months to cold storage (S3/Snowflake) and drop them from the primary DB.
2.  **`XPEvent`**: Gamification generates extremely high write volume.
    *   *Strategy*: Instead of writing every +10 XP immediately to Postgres, push events to a Redis queue or Kafka topic. A background worker (Inngest/QStash) aggregates them and performs bulk upserts to Postgres every 5 minutes.
3.  **`VideoUpload` & `AIAnalysis`**: Video metadata isn't huge, but the `rawMetrics` JSON from AI pose estimation can be massive.
    *   *Strategy*: Do not store raw 60fps JSON telemetry in Postgres. Store the raw JSON file in AWS S3, and only store the S3 URI and the aggregated `AIAnalysisIssue` records in Prisma.

## 7. Recommended Audit & Event Tables

The schema includes two critical tables for system health and asynchronous processing:

1.  **`AuditLog`**: Essential for B2B/Team compliance. If an `ORG_ADMIN` deletes a team, or a `COACH` removes a player, the `AuditLog` records *who* did it, *what* they did, and *when*. This is vital for customer support and resolving disputes over billing or lost data.
2.  **`DomainEvent`**: Implements the **Outbox Pattern** for the event-driven architecture mentioned in the high-level doc.
    *   *Why*: When a video finishes uploading to Mux, Mux sends a webhook. Instead of processing AI analysis synchronously in the webhook handler (which could time out), the handler simply writes a `DomainEvent` (`{ type: "video.ready", payload: { videoId } }`).
    *   A background worker polls `DomainEvent`, picks up the task, sends it to the AI ML pipeline, and marks the event `PROCESSED`. This guarantees no webhooks are lost if the AI service goes down.
