import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import RequireAuth from "@/components/RequireAuth";

// ---------------------------------------------------------------------------
// Lazy page loader — one dynamic import per route group creates code-split
// chunks that Rollup/Vite handles automatically.
// ---------------------------------------------------------------------------

// Marketing
const MarketingHome   = React.lazy(() => import("@/pages/marketing/Home"));
const PlayersPage     = React.lazy(() => import("@/pages/marketing/audiencePages").then(m => ({ default: m.PlayersPage })));
const CoachesPage     = React.lazy(() => import("@/pages/marketing/audiencePages").then(m => ({ default: m.CoachesPage })));
const TeamsPage       = React.lazy(() => import("@/pages/marketing/audiencePages").then(m => ({ default: m.TeamsPage })));
const ExpertsPage     = React.lazy(() => import("@/pages/marketing/audiencePages").then(m => ({ default: m.ExpertsPage })));
const PricingPage     = React.lazy(() => import("@/pages/marketing/audiencePages").then(m => ({ default: m.PricingPage })));
const LiveLanding     = React.lazy(() => import("@/pages/marketing/audiencePages").then(m => ({ default: m.LiveLanding })));

// Auth
const SignIn = React.lazy(() => import("@/pages/SignIn"));
const SignUp = React.lazy(() => import("@/pages/SignUp"));

// Docs
const DocsHome = React.lazy(() => import("@/pages/DocsHome"));
const DocPage  = React.lazy(() => import("@/pages/DocPage"));

// Player App pages
const PlayerDashboard    = React.lazy(() => import("@/pages/app/PlayerPages").then(m => ({ default: m.PlayerDashboard })));
const PlayerWorkout      = React.lazy(() => import("@/pages/app/PlayerPages").then(m => ({ default: m.PlayerWorkout })));
const PlayerUploads      = React.lazy(() => import("@/pages/app/PlayerPages").then(m => ({ default: m.PlayerUploads })));
const PlayerUploadDetail = React.lazy(() => import("@/pages/app/PlayerPages").then(m => ({ default: m.PlayerUploadDetail })));
const PlayerSkills       = React.lazy(() => import("@/pages/app/PlayerPages").then(m => ({ default: m.PlayerSkills })));
const PlayerAchievements = React.lazy(() => import("@/pages/app/PlayerPages").then(m => ({ default: m.PlayerAchievements })));

// Practice Plan Builder
const CoachPracticePlanBuilder = React.lazy(() => import("@/pages/app/coach/PracticePlanBuilder"));
const DrillLibraryPage         = React.lazy(() => import("@/pages/app/coach/DrillLibraryPage"));
const CoachWodPlanner          = React.lazy(() => import("@/pages/app/coach/CoachWodPlanner"));
const CoachPlaybookStudio      = React.lazy(() => import("@/pages/app/coach/PlaybookStudio"));
const CoachPlaybookStudioV3    = React.lazy(() => import("@/pages/app/coach/PlaybookStudioV3"));

// Film pages
const FilmRoomPage        = React.lazy(() => import("@/pages/app/coach/FilmAnalysisPages").then(m => ({ default: m.FilmRoomPage })));
const FilmUploadPage      = React.lazy(() => import("@/pages/app/coach/FilmAnalysisPages").then(m => ({ default: m.FilmUploadPage })));
const FilmSessionPage     = React.lazy(() => import("@/pages/app/coach/FilmAnalysisPages").then(m => ({ default: m.FilmSessionPage })));
const PlayerHighlightsPage = React.lazy(() => import("@/pages/app/coach/FilmAnalysisPages").then(m => ({ default: m.PlayerHighlightsPage })));

// Film-to-Action pages
const FilmLibraryPage     = React.lazy(() => import("@/pages/app/coach/FilmLibraryPage"));
const FilmQueuePage       = React.lazy(() => import("@/pages/app/coach/FilmQueuePage"));
const FilmQueueDetailPage = React.lazy(() => import("@/pages/app/coach/FilmQueueDetailPage"));
const CoachClipPage       = React.lazy(() => import("@/pages/app/coach/CoachClipPage"));

// Scout-to-Practice pages
const GameDayPage         = React.lazy(() => import("@/pages/app/coach/GameDayPage"));

// Staff Roles & Audit Trail
const StaffRolesPage      = React.lazy(() => import("@/pages/app/coach/StaffRolesPage"));

// Program Operations pages
const ProgramOpsHub          = React.lazy(() => import("@/pages/app/coach/ProgramOpsHub"));
const RosterImportPage       = React.lazy(() => import("@/pages/app/coach/RosterImportPage"));
const BroadcastPage          = React.lazy(() => import("@/pages/app/coach/BroadcastPage"));
const TournamentWeekendPage  = React.lazy(() => import("@/pages/app/coach/TournamentWeekendPage"));

// Coach pages
const MessagesPage             = React.lazy(() => import("@/pages/app/coach/MessagesPage"));
const CoachInboxPage           = React.lazy(() => import("@/pages/app/coach/CoachInboxPage"));
const PlayerProfilePage        = React.lazy(() => import("@/pages/app/coach/PlayerProfilePage"));
const CoachIDPPage             = React.lazy(() => import("@/pages/app/coach/CoachIDPPage"));
const PlayerIDPPage            = React.lazy(() => import("@/pages/app/coach/players/PlayerIDPPage"));
const GoalDetailPage           = React.lazy(() => import("@/pages/app/coach/players/GoalDetailPage"));
const BenchmarkingPage         = React.lazy(() => import("@/pages/app/coach/BenchmarkingPage"));
const IDPGeneratorPage         = React.lazy(() => import("@/pages/app/coach/IDPGeneratorPage"));
const FilmSessionDetail        = React.lazy(() => import("@/pages/app/coach/FilmSessionDetail"));
const CoachActionsPage         = React.lazy(() => import("@/pages/app/coach/CoachActionsPage"));
const TeamReadinessPage        = React.lazy(() => import("@/pages/app/coach/TeamReadinessPage"));
const PracticeExecutionPage    = React.lazy(() => import("@/pages/app/coach/PracticeExecutionPage"));
const CoachAnnouncementsPage   = React.lazy(() => import("@/pages/app/coach/CoachAnnouncementsPage"));
const SkillAssessmentPage      = React.lazy(() => import("@/pages/app/coach/SkillAssessmentPage"));
const AIFilmAnalysisHub        = React.lazy(() => import("@/pages/app/coach/AIFilmAnalysisHub"));
const AtRiskInterventionPage   = React.lazy(() => import("@/pages/app/coach/AtRiskInterventionPage"));
const RecruitingHubPage        = React.lazy(() => import("@/pages/app/coach/RecruitingHubPage"));
const ScoutingHubPage          = React.lazy(() => import("@/pages/app/coach/ScoutingHubPage"));
const OpponentScoutPage        = React.lazy(() => import("@/pages/app/coach/OpponentScoutPage"));
const FilmPlaylistPage         = React.lazy(() => import("@/pages/app/coach/FilmPlaylistPage"));
const AbsenceManagementPage    = React.lazy(() => import("@/pages/app/coach/AbsenceManagementPage"));

// Coach Education System
const CoachEducationHub          = React.lazy(() => import("@/pages/app/coach/CoachEducationHub"));
const LearningPathPage           = React.lazy(() => import("@/pages/app/coach/LearningPathPage"));
const CoachingDataMirrorPage     = React.lazy(() => import("@/pages/app/coach/CoachingDataMirrorPage"));
const CoachingImpactReportPage   = React.lazy(() => import("@/pages/app/coach/CoachingImpactReportPage"));
const CueLibraryPage             = React.lazy(() => import("@/pages/app/coach/CueLibraryPage"));
const CoachingJournalPage        = React.lazy(() => import("@/pages/app/coach/CoachingJournalPage"));
const ProgramTerminologyPage     = React.lazy(() => import("@/pages/app/coach/ProgramTerminologyPage"));
const StaffCohortPage            = React.lazy(() => import("@/pages/app/coach/StaffCohortPage"));
const ObservationCalibrationPage = React.lazy(() => import("@/pages/app/coach/ObservationCalibrationPage"));
const PracticeReviewPage         = React.lazy(() => import("@/pages/app/coach/PracticeReviewPage"));
const CertificationPage          = React.lazy(() => import("@/pages/app/coach/CertificationPage"));

// Player pages
const PlayerDevelopmentView  = React.lazy(() => import("@/pages/app/player/PlayerDevelopmentView"));
const PlayerWearablesPage    = React.lazy(() => import("@/pages/app/player/PlayerWearablesPage"));
const AssessmentHistoryPage  = React.lazy(() => import("@/pages/app/player/AssessmentHistoryPage"));
const PlayerAssessmentIDPPage = React.lazy(() => import("@/pages/app/player/PlayerAssessmentIDPPage"));
const DevelopmentTimelinePage = React.lazy(() => import("@/pages/app/player/DevelopmentTimelinePage"));
const PlayerCheckinPage      = React.lazy(() => import("@/pages/app/player/PlayerCheckinPage"));
const PlayerWodPage          = React.lazy(() => import("@/pages/app/player/PlayerWodPage"));
const PlayerAssignmentsPage  = React.lazy(() => import("@/pages/app/player/PlayerAssignmentsPage"));
const PlayerSchedulePage     = React.lazy(() => import("@/pages/app/player/PlayerSchedulePage"));
const PlayerAbsencePage      = React.lazy(() => import("@/pages/app/player/PlayerAbsencePage"));
const PlayStudyList          = React.lazy(() => import("@/pages/app/player/PlayStudy").then(m => ({ default: m.PlayStudyList })));
const PlayStudyPage          = React.lazy(() => import("@/pages/app/player/PlayStudy").then(m => ({ default: m.PlayStudyPage })));
const PlayQuizRunner         = React.lazy(() => import("@/pages/app/player/PlayQuiz"));

// Recruiting platform — player-facing
const PlayerRecruitingDashboard = React.lazy(() => import("@/pages/app/player/PlayerRecruitingDashboard"));
const DevelopmentResumePage     = React.lazy(() => import("@/pages/app/player/DevelopmentResumePage"));
const ProfileVisibilityPage     = React.lazy(() => import("@/pages/app/player/ProfileVisibilityPage"));

// Recruiting platform — coach-facing
const RecruitingExportPage    = React.lazy(() => import("@/pages/app/coach/RecruitingExportPage"));
const BadgeAwardsPage         = React.lazy(() => import("@/pages/app/coach/BadgeAwardsPage"));
const PlayerNarrativePage     = React.lazy(() => import("@/pages/app/coach/PlayerNarrativePage"));
const DevelopmentSynthesisPage = React.lazy(() => import("@/pages/app/coach/DevelopmentSynthesisPage"));

// Recruiting platform — director-facing
const ProspectPoolPage          = React.lazy(() => import("@/pages/app/director/ProspectPoolPage"));
const ProgramReputationPage     = React.lazy(() => import("@/pages/app/director/ProgramReputationPage"));
const RecruiterAccessLogPage    = React.lazy(() => import("@/pages/app/director/RecruiterAccessLogPage"));
const DirectorRecruitingCRMPage = React.lazy(() => import("@/pages/app/director/DirectorRecruitingCRMPage"));

// Recruiting platform — college coach (recruiter) portal
const RecruiterDashboardPage  = React.lazy(() => import("@/pages/app/recruiting/RecruiterDashboardPage"));
const PlayerSearchPage        = React.lazy(() => import("@/pages/app/recruiting/PlayerSearchPage"));
const RecruiterPlayerViewPage = React.lazy(() => import("@/pages/app/recruiting/RecruiterPlayerViewPage"));
const AccessRequestPage       = React.lazy(() => import("@/pages/app/recruiting/AccessRequestPage"));

// Recruiting platform — family portal
const FamilyPrivacyPage           = React.lazy(() => import("@/pages/app/family/FamilyPrivacyPage"));
const AccessRequestsManagerPage   = React.lazy(() => import("@/pages/app/family/AccessRequestsManagerPage"));
const FamilyGrowthReportPage      = React.lazy(() => import("@/pages/app/family/FamilyGrowthReportPage"));

// Public recruiting profile (no auth)
const PublicRecruitingProfilePage = React.lazy(() => import("@/pages/recruiting/PublicRecruitingProfilePage"));

// Recruiting & Showcase Dossier
const DossierBuilderPage  = React.lazy(() => import("@/pages/app/coach/DossierBuilderPage"));
const PublicDossierPage   = React.lazy(() => import("@/pages/recruiting/PublicDossierPage"));

// Team Management Platform (all 5 phases)
const TeamSchedulePage    = React.lazy(() => import("@/pages/app/team/TeamSchedulePage"));
const RosterDetailPage    = React.lazy(() => import("@/pages/app/team/RosterDetailPage"));
const StaffDirectoryPage  = React.lazy(() => import("@/pages/app/team/StaffDirectoryPage"));
const DocumentLibraryPage = React.lazy(() => import("@/pages/app/team/DocumentLibraryPage"));
const TeamMessagingPage   = React.lazy(() => import("@/pages/app/team/TeamMessagingPage"));
const EventDetailPage     = React.lazy(() => import("@/pages/app/team/EventDetailPage"));
const TournamentPage      = React.lazy(() => import("@/pages/app/team/TournamentPage"));
const TeamCalendarPage    = React.lazy(() => import("@/pages/app/team/TeamCalendarPage"));

// Admin pages
const SeasonManagementPage = React.lazy(() => import("@/pages/app/admin/SeasonManagementPage"));
const FormsManagerPage     = React.lazy(() => import("@/pages/app/admin/FormsManagerPage"));
const SeasonSetupPage      = React.lazy(() => import("@/pages/app/admin/SeasonSetupPage"));
const OnboardingPage       = React.lazy(() => import("@/pages/app/admin/OnboardingPage"));
const ReEnrollmentPage     = React.lazy(() => import("@/pages/app/admin/ReEnrollmentPage"));

// Club pages
const ProgramAnalyticsV2Page  = React.lazy(() => import("@/pages/app/club/ProgramAnalyticsV2Page"));
const ClubAnalyticsPage       = React.lazy(() => import("@/pages/app/club/ClubAnalyticsPage"));
const DirectorOverviewPage    = React.lazy(() => import("@/pages/app/club/DirectorOverviewPage"));
const RosterIntelligencePage  = React.lazy(() => import("@/pages/app/club/RosterIntelligencePage"));

// Public profiles
const PlayerPublicProfilePage = React.lazy(() => import("@/pages/app/PlayerPublicProfilePage"));
const PlayerPublicProgramPage = React.lazy(() => import("@/pages/app/PlayerPublicProgramPage"));

// Parent portal
const ParentDashboard         = React.lazy(() => import("@/pages/app/parent/ParentDashboard"));
const ParentChildPage         = React.lazy(() => import("@/pages/app/parent/ParentChildPage"));
const ParentSchedulePage      = React.lazy(() => import("@/pages/app/parent/ParentSchedulePage"));
const ParentBillingPage       = React.lazy(() => import("@/pages/app/parent/ParentBillingPage"));
const ParentFormsPage         = React.lazy(() => import("@/pages/app/parent/ParentFormsPage"));
const ParentAnnouncementsPage = React.lazy(() => import("@/pages/app/parent/ParentAnnouncementsPage"));
const ParentRegistrationPage  = React.lazy(() => import("@/pages/app/parent/ParentRegistrationPage"));
const ParentDigestPage        = React.lazy(() => import("@/pages/app/parent/ParentDigestPage"));
const ParentMessagesPage      = React.lazy(() => import("@/pages/app/parent/ParentMessagesPage"));
const PlayerSummaryPage       = React.lazy(() => import("@/pages/app/parent/PlayerSummaryPage"));

// Club operations (TEAM_ADMIN)
const ClubDashboard         = React.lazy(() => import("@/pages/app/admin/AdminDashboard"));
const ClubRegistrationsPage = React.lazy(() => import("@/pages/app/admin/AdminRegistrationsPage"));
const ClubBillingPage       = React.lazy(() => import("@/pages/app/admin/AdminBillingPage"));
const ClubTeamsPage         = React.lazy(() => import("@/pages/app/admin/AdminTeamsPage"));
const ClubMembershipsPage   = React.lazy(() => import("@/pages/app/admin/AdminMembershipsPage"));

// Billing
const AppPricingPage = React.lazy(() => import("@/pages/app/billing/PricingPage").then(m => ({ default: m.AppPricingPage })));
const BillingPortal  = React.lazy(() => import("@/pages/app/billing/BillingPortal").then(m => ({ default: m.BillingPortal })));
const SeatManager    = React.lazy(() => import("@/pages/app/billing/SeatManager").then(m => ({ default: m.SeatManager })));
const ExpertPayouts  = React.lazy(() => import("@/pages/app/billing/ExpertPayouts").then(m => ({ default: m.ExpertPayouts })));
const BillingAdmin   = React.lazy(() => import("@/pages/app/admin/BillingAdmin").then(m => ({ default: m.BillingAdmin })));

// AppPages barrel
const CoachDashboard    = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.CoachDashboard })));
const CoachRoster       = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.CoachRoster })));
const CoachParents      = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.CoachParents })));
const CoachQueue        = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.CoachQueue })));
const CoachQueueDetail  = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.CoachQueueDetail })));
const CoachAssignments  = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.CoachAssignments })));
const CoachPracticePlans = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.CoachPracticePlans })));
const CoachBookings     = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.CoachBookings })));
const TeamDashboard     = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.TeamDashboard })));
const TeamInvite        = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.TeamInvite })));
const TeamBilling       = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.TeamBilling })));
const MarketplaceHome   = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.MarketplaceHome })));
const MarketplaceProfile = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.MarketplaceProfile })));
const FilmRoomHome      = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.FilmRoomHome })));
const FilmClipDetail    = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.FilmClipDetail })));
const FilmInbox         = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.FilmInbox })));
const LiveHome          = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.LiveHome })));
const LiveEventDetail   = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.LiveEventDetail })));
const LearnHome         = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.LearnHome })));
const LearnCourseDetail = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.LearnCourseDetail })));
const SettingsBilling   = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.SettingsBilling })));
const AdminOverview     = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.AdminOverview })));
const AdminUsers        = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.AdminUsers })));
const AdminModeration   = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.AdminModeration })));
const AdminAudit        = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.AdminAudit })));
const AdminExperts      = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.AdminExperts })));
const AdminJobs         = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.AdminJobs })));
const ExpertDashboard   = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.ExpertDashboard })));
const ExpertOffers      = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.ExpertOffers })));
const ExpertBookings    = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.ExpertBookings })));
const TeamRoster        = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.TeamRoster })));
const TeamTeams         = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.TeamTeams })));
const TeamSettings      = React.lazy(() => import("@/pages/app/AppPages").then(m => ({ default: m.TeamSettings })));

// Payments module
const PaymentsDashboardPage  = React.lazy(() => import("@/pages/app/payments/PaymentsDashboardPage"));
const OutstandingPaymentsPage = React.lazy(() => import("@/pages/app/payments/OutstandingPaymentsPage"));
const CreateFeeRequestPage   = React.lazy(() => import("@/pages/app/payments/CreateFeeRequestPage"));

// New player & coach experience pages
const QuickAssessFlowPage      = React.lazy(() => import("@/pages/app/coach/QuickAssessFlowPage"));
const CoachCareerRecordPage    = React.lazy(() => import("@/pages/app/coach/CoachCareerRecordPage"));
const FilmCorroborationEntryPage = React.lazy(() => import("@/pages/app/coach/FilmCorroborationEntryPage"));
const LiveObservationQualityPage = React.lazy(() => import("@/pages/app/coach/LiveObservationQualityPage"));
const CoachSeasonReportPage    = React.lazy(() => import("@/pages/app/coach/CoachSeasonReportPage"));
const ModulePrescriptionPage   = React.lazy(() => import("@/pages/app/coach/education/ModulePrescriptionPage"));
const CoachViewTransparencyPage = React.lazy(() => import("@/pages/app/player/CoachViewTransparencyPage"));
const SkillVelocityPage        = React.lazy(() => import("@/pages/app/player/SkillVelocityPage"));
const PlayerGrowthStoryPage    = React.lazy(() => import("@/pages/app/player/PlayerGrowthStoryPage"));
const PlayerMilestonePage      = React.lazy(() => import("@/pages/app/player/PlayerMilestonePage"));
const PlayerProgressPage       = React.lazy(() => import("@/pages/app/player/PlayerProgressPage"));
const RecruiterViewActivityPage = React.lazy(() => import("@/pages/app/parent/RecruiterViewActivityPage"));
const ParentWeeklyPulsePage    = React.lazy(() => import("@/pages/app/parent/ParentWeeklyPulsePage"));
const PlayerOnboardingPage     = React.lazy(() => import("@/pages/app/player/PlayerOnboardingPage"));
const CoachOnboardingFlow      = React.lazy(() => import("@/pages/app/coach/CoachOnboardingFlow"));

// KPI / Analytics dashboard pages
const VDVCommandCenterPage         = React.lazy(() => import("@/pages/app/analytics/VDVCommandCenterPage"));
const NorthStarDashboardPage       = React.lazy(() => import("@/pages/app/analytics/NorthStarDashboardPage"));
const ActivationHeatMapPage        = React.lazy(() => import("@/pages/app/analytics/ActivationHeatMapPage"));
const DataQualityScorecardPage     = React.lazy(() => import("@/pages/app/analytics/DataQualityScorecardPage"));
const WarningMetricsDashboardPage  = React.lazy(() => import("@/pages/app/analytics/WarningMetricsDashboardPage"));
const EnterpriseExpansionPage      = React.lazy(() => import("@/pages/app/analytics/EnterpriseExpansionPage"));
const CoachEffectivenessDashboardPage = React.lazy(() => import("@/pages/app/coach/CoachEffectivenessDashboardPage"));
const PlayerDevelopmentOutcomesPage   = React.lazy(() => import("@/pages/app/coach/PlayerDevelopmentOutcomesPage"));
const ProgramRetentionLeadersPage     = React.lazy(() => import("@/pages/app/coach/ProgramRetentionLeadersPage"));
const ProgramHealthDashboardPage   = React.lazy(() => import("@/pages/app/director/ProgramHealthDashboardPage"));
const TeamOperationsMetricsPage    = React.lazy(() => import("@/pages/app/admin/TeamOperationsMetricsPage"));
const ParentEngagementMetricsPage  = React.lazy(() => import("@/pages/app/parent/ParentEngagementMetricsPage"));
const ClubGrowthMetricsPage        = React.lazy(() => import("@/pages/app/club/ClubGrowthMetricsPage"));
const PlayerVDVContributionPage    = React.lazy(() => import("@/pages/app/player/PlayerVDVContributionPage"));

// ---------------------------------------------------------------------------
// Auth guard HOC — works transparently with React.lazy components
// ---------------------------------------------------------------------------
const guard = (Component: React.ComponentType<any>) => (props: any) => (
  <RequireAuth><Component {...props} /></RequireAuth>
);

// Minimal spinner shown while a lazy chunk is loading
function PageFallback() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        {/* Marketing */}
        <Route path="/" component={MarketingHome} />
        <Route path="/players" component={PlayersPage} />
        <Route path="/coaches" component={CoachesPage} />
        <Route path="/teams" component={TeamsPage} />
        <Route path="/experts" component={ExpertsPage} />
        <Route path="/pricing" component={PricingPage} />
        <Route path="/live" component={LiveLanding} />

        {/* Auth */}
        <Route path="/sign-in" component={SignIn} />
        <Route path="/sign-in/:rest*" component={SignIn} />
        <Route path="/sign-up" component={SignUp} />
        <Route path="/sign-up/:rest*" component={SignUp} />

        {/* Docs */}
        <Route path="/docs" component={DocsHome} />
        <Route path="/docs/:slug" component={DocPage} />

        {/* Player App */}
        <Route path="/app/player" component={PlayerDashboard} />
        <Route path="/app/player/workout" component={PlayerWorkout} />
        <Route path="/app/player/uploads" component={PlayerUploads} />
        <Route path="/app/player/uploads/:id" component={PlayerUploadDetail} />
        <Route path="/app/player/skills" component={PlayerSkills} />
        <Route path="/app/player/achievements" component={PlayerAchievements} />
        <Route path="/app/player/development" component={PlayerDevelopmentView} />
        <Route path="/app/player/wearables" component={PlayerWearablesPage} />
        <Route path="/app/player/assignments" component={PlayerAssignmentsPage} />
        <Route path="/app/player/schedule" component={PlayerSchedulePage} />
        <Route path="/app/player/checkin" component={PlayerCheckinPage} />
        <Route path="/app/player/check-in" component={PlayerCheckinPage} />
        <Route path="/app/player/wod" component={PlayerWodPage} />
        <Route path="/app/player/assessments" component={PlayerAssessmentIDPPage} />
        <Route path="/app/player/timeline" component={DevelopmentTimelinePage} />
        <Route path="/app/player/absence" component={PlayerAbsencePage} />
        <Route path="/app/player/recruiting" component={PlayerRecruitingDashboard} />
        <Route path="/app/player/resume" component={DevelopmentResumePage} />
        <Route path="/app/player/recruiting/visibility" component={ProfileVisibilityPage} />

        {/* Coach HQ - auth required */}
        <Route path="/app/coach" component={guard(CoachDashboard)} />
        <Route path="/app/coach/inbox" component={guard(CoachInboxPage)} />
        <Route path="/app/coach/players/:id/idp/goals/:goalId" component={guard(GoalDetailPage)} />
        <Route path="/app/coach/players/:id/idp" component={guard(PlayerIDPPage)} />
        <Route path="/app/coach/players/:id/dossier" component={guard(DossierBuilderPage)} />
        <Route path="/app/coach/players/:id" component={guard(PlayerProfilePage)} />
        <Route path="/app/coach/roster" component={guard(CoachRoster)} />
        <Route path="/app/coach/parents" component={guard(CoachParents)} />
        {/* /app/coach/queue and /app/coach/queue/:videoId handled in Film-to-Action section below */}
        <Route path="/app/coach/actions" component={guard(CoachActionsPage)} />
        <Route path="/app/coach/readiness" component={guard(TeamReadinessPage)} />
        <Route path="/app/coach/scouting" component={guard(ScoutingHubPage)} />
        <Route path="/app/coach/scouting/:opponentId/game-plan" component={guard(GameDayPage)} />
        <Route path="/app/coach/scouting/:opponentId" component={guard(OpponentScoutPage)} />
        {/* Program Operations — specific sub-routes before the hub catch-all */}
        <Route path="/app/coach/program/roster-import" component={guard(RosterImportPage)} />
        <Route path="/app/coach/program/broadcast" component={guard(BroadcastPage)} />
        <Route path="/app/coach/program/tournament/:id" component={guard(TournamentWeekendPage)} />
        <Route path="/app/coach/program" component={guard(ProgramOpsHub)} />
        <Route path="/app/coach/assignments" component={guard(CoachAssignments)} />
        <Route path="/app/coach/practice-plans" component={guard(CoachPracticePlanBuilder)} />
        <Route path="/app/coach/practice-plans/:id/execute" component={guard(PracticeExecutionPage)} />
        <Route path="/app/coach/announcements" component={guard(CoachAnnouncementsPage)} />
        <Route path="/app/coach/assessments" component={guard(SkillAssessmentPage)} />
        <Route path="/app/coach/benchmarks" component={guard(BenchmarkingPage)} />
        <Route path="/app/coach/idp-generator" component={guard(IDPGeneratorPage)} />
        <Route path="/app/coach/film/analyze" component={guard(AIFilmAnalysisHub)} />
        <Route path="/app/coach/at-risk" component={guard(AtRiskInterventionPage)} />
        <Route path="/app/coach/recruiting" component={guard(RecruitingHubPage)} />
        <Route path="/app/coach/idp/generate" component={guard(IDPGeneratorPage)} />
        <Route path="/app/coach/drills" component={guard(DrillLibraryPage)} />
        <Route path="/app/coach/wods" component={guard(CoachWodPlanner)} />
        <Route path="/app/coach/practice-plans/legacy" component={guard(CoachPracticePlans)} />
        <Route path="/app/coach/bookings" component={guard(CoachBookings)} />
        <Route path="/app/coach/messages" component={guard(MessagesPage)} />
        <Route path="/app/messages" component={guard(MessagesPage)} />
        <Route path="/app/coach/playbook" component={guard(CoachPlaybookStudioV3)} />
        <Route path="/app/coach/playbook-v3" component={guard(CoachPlaybookStudioV3)} />

        {/* Coach Education System */}
        <Route path="/app/coach/education" component={guard(CoachEducationHub)} />
        <Route path="/app/coach/education/paths" component={guard(LearningPathPage)} />
        <Route path="/app/coach/education/module/:id" component={guard(LearningPathPage)} />
        <Route path="/app/coach/education/mirror" component={guard(CoachingDataMirrorPage)} />
        <Route path="/app/coach/education/impact" component={guard(CoachingImpactReportPage)} />
        <Route path="/app/coach/cues" component={guard(CueLibraryPage)} />
        <Route path="/app/coach/education/journal" component={guard(CoachingJournalPage)} />
        <Route path="/app/coach/education/terminology" component={guard(ProgramTerminologyPage)} />
        <Route path="/app/coach/education/cohort" component={guard(StaffCohortPage)} />
        <Route path="/app/coach/education/calibration" component={guard(ObservationCalibrationPage)} />
        <Route path="/app/coach/education/practice-review" component={guard(PracticeReviewPage)} />
        <Route path="/app/coach/education/certifications" component={guard(CertificationPage)} />
        <Route path="/app/coach/absences" component={guard(AbsenceManagementPage)} />
        <Route path="/app/coach/recruiting/export" component={guard(RecruitingExportPage)} />
        <Route path="/app/coach/recruiting/badges" component={guard(BadgeAwardsPage)} />
        <Route path="/app/coach/recruiting/narratives" component={guard(PlayerNarrativePage)} />
        <Route path="/app/coach/recruiting/synthesis/:playerId" component={guard(DevelopmentSynthesisPage)} />
        <Route path="/app/coach/recruiting/synthesis" component={guard(DevelopmentSynthesisPage)} />

        {/* Team */}
        <Route path="/app/team" component={TeamDashboard} />
        <Route path="/app/team/schedule" component={TeamSchedulePage} />
        <Route path="/app/team/invite" component={TeamInvite} />
        <Route path="/app/team/billing" component={TeamBilling} />
        <Route path="/app/team/calendar" component={guard(TeamCalendarPage)} />
        <Route path="/app/team/roster-detail" component={guard(RosterDetailPage)} />
        <Route path="/app/team/staff" component={guard(StaffDirectoryPage)} />
        <Route path="/app/coach/staff-roles" component={guard(StaffRolesPage)} />
        <Route path="/app/team/documents" component={guard(DocumentLibraryPage)} />
        <Route path="/app/team/messaging" component={guard(TeamMessagingPage)} />
        <Route path="/app/team/events/:id" component={guard(EventDetailPage)} />
        <Route path="/app/team/tournament/:id" component={guard(TournamentPage)} />

        {/* Marketplace */}
        <Route path="/app/marketplace" component={MarketplaceHome} />
        <Route path="/app/marketplace/experts/:slug" component={MarketplaceProfile} />

        {/* Film */}
        <Route path="/app/film" component={FilmRoomHome} />
        <Route path="/app/film/clips/:id" component={FilmClipDetail} />
        <Route path="/app/film/inbox" component={FilmInbox} />
        <Route path="/app/coach/film/upload" component={guard(FilmUploadPage)} />
        <Route path="/app/coach/film/sessions/:id" component={guard(FilmSessionDetail)} />
        <Route path="/app/coach/film/playlists/:id" component={guard(FilmPlaylistPage)} />
        {/* Film-to-Action routes — ordered specific before general */}
        <Route path="/app/coach/film" component={guard(FilmLibraryPage)} />
        <Route path="/app/coach/queue/:videoId" component={guard(FilmQueueDetailPage)} />
        <Route path="/app/coach/queue" component={guard(FilmQueuePage)} />
        <Route path="/app/coach/clips/:clipId" component={guard(CoachClipPage)} />
        <Route path="/app/player/highlights/:playerId" component={PlayerHighlightsPage} />
        <Route path="/app/player/highlights" component={PlayerHighlightsPage} />
        <Route path="/app/player/plays/:id/study" component={PlayStudyPage} />
        <Route path="/app/player/plays" component={PlayStudyList} />

        {/* Playbook */}
        <Route path="/app/playbook" component={CoachPlaybookStudioV3} />
        <Route path="/app/playbook-v3" component={CoachPlaybookStudioV3} />
        <Route path="/app/playbook/legacy" component={CoachPlaybookStudio} />
        <Route path="/app/player/quizzes/:id" component={PlayQuizRunner} />
        <Route path="/app/player/quizzes" component={PlayQuizRunner} />

        {/* Live */}
        <Route path="/app/live" component={LiveHome} />
        <Route path="/app/live/:id" component={LiveEventDetail} />

        {/* Learn */}
        <Route path="/app/learn" component={LearnHome} />
        <Route path="/app/learn/courses/:id" component={LearnCourseDetail} />

        {/* Settings */}
        <Route path="/app/settings/billing" component={SettingsBilling} />

        {/* Billing */}
        <Route path="/app/billing" component={BillingPortal} />
        <Route path="/app/billing/pricing" component={AppPricingPage} />
        <Route path="/app/team/seats" component={SeatManager} />
        <Route path="/app/expert/payouts" component={ExpertPayouts} />

        {/* Admin */}
        <Route path="/app/admin" component={AdminOverview} />
        <Route path="/app/admin/billing" component={BillingAdmin} />
        <Route path="/app/admin/users" component={AdminUsers} />
        <Route path="/app/admin/moderation" component={AdminModeration} />
        <Route path="/app/admin/audit" component={AdminAudit} />
        <Route path="/app/admin/seasons" component={guard(SeasonManagementPage)} />
        <Route path="/app/admin/experts" component={AdminExperts} />
        <Route path="/app/admin/jobs" component={AdminJobs} />
        <Route path="/app/admin/forms" component={guard(FormsManagerPage)} />
        <Route path="/app/admin/season-setup" component={guard(SeasonSetupPage)} />
        <Route path="/app/admin/onboarding" component={guard(OnboardingPage)} />
        <Route path="/app/admin/re-enrollment" component={guard(ReEnrollmentPage)} />

        {/* Parent */}
        <Route path="/app/parent" component={ParentDashboard} />
        <Route path="/app/parent/child" component={ParentChildPage} />
        <Route path="/app/parent/schedule" component={ParentSchedulePage} />
        <Route path="/app/parent/billing" component={ParentBillingPage} />
        <Route path="/app/parent/forms" component={ParentFormsPage} />
        <Route path="/app/parent/announcements" component={ParentAnnouncementsPage} />
        <Route path="/app/parent/messages" component={ParentMessagesPage} />
        <Route path="/app/parent/register" component={ParentRegistrationPage} />
        <Route path="/app/parent/digest" component={ParentDigestPage} />
        <Route path="/app/parent/player/:playerId/summary" component={PlayerSummaryPage} />

        {/* Family recruiting / privacy portal */}
        <Route path="/app/family/privacy" component={FamilyPrivacyPage} />
        <Route path="/app/family/access-requests" component={AccessRequestsManagerPage} />
        <Route path="/app/family/report" component={FamilyGrowthReportPage} />

        {/* Public profiles — no auth */}
        <Route path="/profile/:id" component={PlayerPublicProfilePage} />
        <Route path="/profile/program/:slug" component={PlayerPublicProgramPage} />
        <Route path="/recruiting/:slug" component={PublicRecruitingProfilePage} />
        {/* Showcase Dossier public profile (no auth) */}
        <Route path="/p/:slug" component={PublicDossierPage} />

        {/* Club operations */}
        <Route path="/app/club" component={guard(ClubDashboard)} />
        <Route path="/app/club/registrations" component={guard(ClubRegistrationsPage)} />
        <Route path="/app/club/billing" component={guard(ClubBillingPage)} />
        <Route path="/app/club/teams" component={guard(ClubTeamsPage)} />
        <Route path="/app/club/memberships" component={guard(ClubMembershipsPage)} />
        <Route path="/app/club/analytics" component={guard(ClubAnalyticsPage)} />
        <Route path="/app/club/analytics/v2" component={guard(ProgramAnalyticsV2Page)} />
        <Route path="/app/club/director" component={guard(DirectorOverviewPage)} />
        <Route path="/app/club/roster-intel" component={guard(RosterIntelligencePage)} />

        {/* Director recruiting */}
        <Route path="/app/director/prospects" component={guard(ProspectPoolPage)} />
        <Route path="/app/director/program-reputation" component={guard(ProgramReputationPage)} />
        <Route path="/app/director/recruiter-access" component={guard(RecruiterAccessLogPage)} />
        <Route path="/app/director/recruiting-crm" component={guard(DirectorRecruitingCRMPage)} />

        {/* College coach (recruiter) portal */}
        <Route path="/app/recruiter" component={guard(RecruiterDashboardPage)} />
        <Route path="/app/recruiter/search" component={guard(PlayerSearchPage)} />
        <Route path="/app/recruiter/players/:id" component={guard(RecruiterPlayerViewPage)} />
        <Route path="/app/recruiter/access-requests" component={guard(AccessRequestPage)} />

        {/* Expert */}
        <Route path="/app/expert" component={ExpertDashboard} />
        <Route path="/app/expert/offers" component={ExpertOffers} />
        <Route path="/app/expert/bookings" component={ExpertBookings} />

        {/* Team extras */}
        <Route path="/app/team/roster" component={TeamRoster} />
        <Route path="/app/team/teams" component={TeamTeams} />
        <Route path="/app/team/settings" component={TeamSettings} />

        {/* Payments module */}
        <Route path="/app/payments"             component={guard(PaymentsDashboardPage)} />
        <Route path="/app/payments/outstanding"  component={guard(OutstandingPaymentsPage)} />
        <Route path="/app/payments/create"       component={guard(CreateFeeRequestPage)} />

        {/* New player & coach experience routes */}
        <Route path="/app/coach/assess/quick"          component={guard(QuickAssessFlowPage)} />
        <Route path="/app/coach/career"                component={guard(CoachCareerRecordPage)} />
        <Route path="/app/coach/film-link"             component={guard(FilmCorroborationEntryPage)} />
        <Route path="/app/coach/observe/quality"       component={guard(LiveObservationQualityPage)} />
        <Route path="/app/coach/season-report"         component={guard(CoachSeasonReportPage)} />
        <Route path="/app/coach/education/prescriptions" component={guard(ModulePrescriptionPage)} />
        <Route path="/app/player/coach-view"           component={CoachViewTransparencyPage} />
        <Route path="/app/player/skill-velocity"       component={SkillVelocityPage} />
        <Route path="/app/player/growth-story"         component={PlayerGrowthStoryPage} />
        <Route path="/app/player/milestones"           component={PlayerMilestonePage} />
        <Route path="/app/player/progress"             component={PlayerProgressPage} />
        <Route path="/app/parent/recruiter-activity"   component={RecruiterViewActivityPage} />
        <Route path="/app/parent/weekly-pulse"         component={ParentWeeklyPulsePage} />
        <Route path="/app/player/onboarding"           component={PlayerOnboardingPage} />
        <Route path="/app/coach/onboarding"            component={guard(CoachOnboardingFlow)} />

        {/* KPI Analytics — platform-level */}
        <Route path="/app/analytics/vdv"          component={guard(VDVCommandCenterPage)} />
        <Route path="/app/analytics/north-star"   component={guard(NorthStarDashboardPage)} />
        <Route path="/app/analytics/activation"   component={guard(ActivationHeatMapPage)} />
        <Route path="/app/analytics/data-quality" component={guard(DataQualityScorecardPage)} />
        <Route path="/app/analytics/warnings"     component={guard(WarningMetricsDashboardPage)} />
        <Route path="/app/analytics/enterprise"   component={guard(EnterpriseExpansionPage)} />

        {/* KPI Analytics — coach */}
        <Route path="/app/coach/effectiveness"        component={guard(CoachEffectivenessDashboardPage)} />
        <Route path="/app/coach/development-outcomes" component={guard(PlayerDevelopmentOutcomesPage)} />
        <Route path="/app/coach/retention-leaders"    component={guard(ProgramRetentionLeadersPage)} />

        {/* KPI Analytics — director / admin */}
        <Route path="/app/director/program-health"  component={guard(ProgramHealthDashboardPage)} />
        <Route path="/app/admin/operations-metrics" component={guard(TeamOperationsMetricsPage)} />

        {/* KPI Analytics — club */}
        <Route path="/app/club/growth" component={guard(ClubGrowthMetricsPage)} />

        {/* KPI Analytics — player */}
        <Route path="/app/player/vdv" component={PlayerVDVContributionPage} />

        {/* KPI Analytics — parent */}
        <Route path="/app/parent/engagement" component={ParentEngagementMetricsPage} />

        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
