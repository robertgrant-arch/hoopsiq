import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  drillCategories,
  drillLibrary,
  findCategory,
  type Drill,
} from "@/features/practice-plan/mock";
import { useCustomDrillsStore } from "@/lib/customDrillsStore";
import { useAuth } from "@/lib/auth";
import { CustomDrillEditor } from "@/components/coach/CustomDrillEditor";

export default function DrillLibraryPage() {
  const { user } = useAuth();
  const coachId = user?.id ?? "coach_anonymous";
  const orgId = (user as any)?.orgId as string | undefined;
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | "ALL">("ALL");
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Drill | null>(null);

  const allCustomDrills = useCustomDrillsStore((s) => s.drills);
  const removeCustom = useCustomDrillsStore((s) => s.remove);
  const customDrills = useMemo(
    () =>
      allCustomDrills.filter((d) => {
        if (d.visibility === "public") return true;
        if (d.visibility === "org" && orgId && d.orgId === orgId) return true;
        return d.ownerCoachId === coachId;
      }),
    [allCustomDrills, coachId, orgId],
  );

  const allDrills = useMemo(
    () => [...customDrills, ...drillLibrary],
    [customDrills],
  );

  const visible = useMemo(() => {
    return allDrills.filter((d) => {
      const title = typeof d.title === "string" ? d.title : "";
      const description = typeof d.description === "string" ? d.description : "";
      const tags = Array.isArray(d.tags) ? d.tags : [];
      if (showMineOnly && !d.isCustom) return false;
      if (category !== "ALL" && d.categoryId !== category) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        title.toLowerCase().includes(q) ||
        description.toLowerCase().includes(q) ||
        tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [allDrills, showMineOnly, category, search]);

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Coach HQ"
          title="Drill Library"
          subtitle="Research-backed global drills plus your custom drill bank. Create drills here, then use them in Practice Plan Builder."
          actions={
            <Button
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
              className="h-9"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Custom Drill
            </Button>
          }
        />

        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search drills by name, description, or tags"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={showMineOnly ? "default" : "outline"}
                  onClick={() => setShowMineOnly((v) => !v)}
                  className="h-8"
                >
                  {showMineOnly ? "Showing My Drills" : "Show My Drills Only"}
                </Button>
                <Button
                  variant={category === "ALL" ? "default" : "outline"}
                  onClick={() => setCategory("ALL")}
                  className="h-8"
                >
                  All Categories
                </Button>
                {drillCategories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={category === cat.id ? "default" : "outline"}
                    onClick={() => setCategory(cat.id)}
                    className="h-8"
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((drill) => {
            const cat = findCategory(drill.categoryId);
            const owned = drill.isCustom && drill.ownerCoachId === coachId;
            return (
              <Card key={drill.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between gap-2">
                    <CardTitle className="text-base leading-tight">{drill.title}</CardTitle>
                    {drill.isCustom && <Badge variant="secondary">Custom</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {cat?.name} · {drill.defaultDurationMin} min · {drill.intensity}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {drill.description ?? "No description provided."}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(drill.tags) ? drill.tags : []).slice(0, 6).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {owned && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(drill);
                          setEditorOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeCustom(drill.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        {visible.length === 0 && (
          <div className="text-sm text-muted-foreground mt-4">
            No drills match the current filters.
          </div>
        )}
      </div>

      <CustomDrillEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editing={editing}
        ownerCoachId={coachId}
        orgId={orgId}
      />
    </AppShell>
  );
}
