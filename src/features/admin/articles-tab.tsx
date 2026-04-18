import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Plus,
  Sparkles,
  Loader2,
  Pencil,
  Trash2,
  ExternalLink,
  RefreshCw,
  Image as ImageIcon,
  X,
  Upload,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { api } from "../../lib/api";
import type {
  BlogArticle,
  BlogArticleListItem,
  ArticleUpsertRequest,
  GenerateArticleRequest,
} from "../../types";
import { ModalShell, ModalInput, ModalFooter } from "../../routes/app/admin";

type View = { kind: "list" } | { kind: "edit"; articleId?: string };

export function ArticlesAdminTab() {
  const [view, setView] = useState<View>({ kind: "list" });
  const [articles, setArticles] = useState<BlogArticleListItem[] | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BlogArticleListItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await api.articles.listAdmin();
      setArticles(list);
    } catch {
      setError("Failed to load articles");
      setArticles([]);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (view.kind === "edit") {
    return (
      <ArticleEditor
        articleId={view.articleId}
        onClose={() => {
          setView({ kind: "list" });
          refresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-neutral-500">
            {articles ? `${articles.length} article${articles.length === 1 ? "" : "s"}` : "Loading…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGenerate(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate with AI
          </button>
          <button
            onClick={() => setView({ kind: "edit" })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
          >
            <Plus className="h-3.5 w-3.5" />
            New article
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {articles === null ? (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-neutral-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading articles…
            </div>
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="mb-2 h-6 w-6 text-neutral-300" />
              <p className="text-sm text-neutral-500">No articles yet.</p>
              <p className="mt-1 text-xs text-neutral-400">
                Generate one from a single prompt, or write your own.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-neutral-200 text-neutral-500">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Title</th>
                    <th className="py-2.5 px-4 font-semibold">Category</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold">Author</th>
                    <th className="py-2.5 px-4 font-semibold">Updated</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((a) => (
                    <tr key={a.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-neutral-900">{a.title || "Untitled"}</div>
                        <div className="text-[11px] text-neutral-400">/{a.slug}</div>
                      </td>
                      <td className="py-2.5 px-4 text-neutral-700">{a.category}</td>
                      <td className="py-2.5 px-4">
                        <Badge variant={a.status === "published" ? "info" : "default"}>
                          {a.status === "published" ? "Published" : "Draft"}
                        </Badge>
                        {a.isFeatured && (
                          <Badge variant="metamed" className="ml-1">
                            Featured
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-neutral-700">{a.authorName}</td>
                      <td className="py-2.5 px-4 text-neutral-500">
                        {new Date(a.updatedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {a.status === "published" && (
                            <a
                              href={`https://metamed.io/blog/${a.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              title="View on blog"
                              className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button
                            title="Edit"
                            onClick={() => setView({ kind: "edit", articleId: a.id })}
                            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="Delete"
                            onClick={() => setDeleteTarget(a)}
                            className="rounded-md p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showGenerate && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onSuccess={(id) => {
            setShowGenerate(false);
            setView({ kind: "edit", articleId: id });
          }}
        />
      )}

      {deleteTarget && (
        <ModalShell title="Delete article?" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-neutral-700">
            Permanently delete <strong>{deleteTarget.title}</strong>? This cannot be undone.
          </p>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                try {
                  await api.articles.delete(deleteTarget.id);
                  setDeleteTarget(null);
                  refresh();
                } catch {
                  setError("Failed to delete article");
                  setDeleteTarget(null);
                }
              }}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

/* ----- Generate Modal ----- */

function GenerateModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (id: string) => void }) {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("clinical-investigative");
  const [length, setLength] = useState<"short" | "medium" | "long">("long");
  const [category, setCategory] = useState("Surveillance");
  const [generateImage, setGenerateImage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const req: GenerateArticleRequest = {
        topic: topic.trim(),
        tone,
        length,
        category,
        generateImage,
      };
      const res = await api.articles.generate(req);
      onSuccess(res.id);
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "Generation failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <ModalShell title="Generate article with AI" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-neutral-600">Topic / prompt</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Latest UKHSA data on carbapenemase-producing Enterobacterales in NHS hospitals, 2024-2025"
            className="h-24 w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:bg-white"
            required
          />
          <p className="mt-1 text-[11px] text-neutral-400">
            The AI will research using web search and write an evidence-led IPC article with citations.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-neutral-600">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-sky-400"
            >
              <option>Surveillance</option>
              <option>AMR</option>
              <option>Outbreaks</option>
              <option>Stewardship</option>
              <option>Briefing</option>
              <option>Research</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-neutral-600">Length</label>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value as "short" | "medium" | "long")}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-sky-400"
            >
              <option value="short">Short (500-700)</option>
              <option value="medium">Medium (900-1200)</option>
              <option value="long">Long (1400-1800)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-neutral-600">Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-sky-400"
          >
            <option value="clinical-investigative">Clinical investigative</option>
            <option value="professional clinical">Professional clinical</option>
            <option value="explainer">Plain-English explainer</option>
            <option value="commentary">Editorial commentary</option>
          </select>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
          <input
            type="checkbox"
            checked={generateImage}
            onChange={(e) => setGenerateImage(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-neutral-300"
          />
          Generate cover image with DALL-E
        </label>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">{error}</div>
        )}

        {loading && (
          <div className="rounded border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">
            <div className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Researching with web search and drafting article. This usually takes 1-3 minutes.
            </div>
          </div>
        )}

        <ModalFooter loading={loading} onClose={onClose} submitLabel="Generate" />
      </form>
    </ModalShell>
  );
}

/* ----- Editor ----- */

function ArticleEditor({ articleId, onClose }: { articleId?: string; onClose: () => void }) {
  const isNew = !articleId;
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Briefing");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [isFeatured, setIsFeatured] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [regeneratingImage, setRegeneratingImage] = useState(false);

  useEffect(() => {
    if (!articleId) return;
    api.articles
      .getAdmin(articleId)
      .then((a: BlogArticle) => {
        setTitle(a.title);
        setSlug(a.slug);
        setCategory(a.category);
        setSummary(a.summary);
        setContent(a.content);
        setCoverImageUrl(a.coverImageUrl);
        setStatus(a.status === "published" ? "published" : "draft");
        setIsFeatured(a.isFeatured);
        setMetaTitle(a.metaTitle);
        setMetaDescription(a.metaDescription);
        setKeywords(a.keywords);
      })
      .catch(() => setError("Failed to load article"))
      .finally(() => setLoading(false));
  }, [articleId]);

  async function handleSave(publish?: boolean) {
    setSaving(true);
    setError(null);
    try {
      const req: ArticleUpsertRequest = {
        title,
        slug: slug || undefined,
        category,
        summary,
        content,
        coverImageUrl,
        status: publish === undefined ? status : publish ? "published" : "draft",
        isFeatured,
        metaTitle,
        metaDescription,
        keywords,
      };
      if (publish !== undefined) setStatus(publish ? "published" : "draft");
      if (isNew) {
        const res = await api.articles.create(req);
        // Switch to edit mode for the newly created article — close & reopen
        // simpler: close back to list which will show the new article
        await new Promise((r) => setTimeout(r, 50));
        if (res?.id) {
          onClose();
          return;
        }
      } else if (articleId) {
        await api.articles.update(articleId, req);
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadCover(file: File) {
    setUploadingImage(true);
    setError(null);
    try {
      const res = await api.articles.uploadImage(file);
      setCoverImageUrl(res.url);
    } catch {
      setError("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleRegenerateImage() {
    if (!articleId) return;
    setRegeneratingImage(true);
    setError(null);
    try {
      const res = await api.articles.regenerateImage(articleId);
      setCoverImageUrl(res.coverImageUrl);
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "Failed to regenerate image");
    } finally {
      setRegeneratingImage(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-xs text-neutral-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading article…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to articles
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <Eye className="h-3.5 w-3.5" />
            {showPreview ? "Hide preview" : "Preview"}
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
            Save draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving || !title.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-40"
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
            Publish
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <Card>
            <CardContent className="space-y-3 p-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article title"
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-lg font-semibold outline-none focus:border-sky-400"
              />
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="One- or two-sentence summary used on cards and meta description"
                className="w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:bg-white"
                rows={2}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                  Content (HTML)
                </label>
                <span className="text-[11px] text-neutral-400">
                  Use h2, p, ul, blockquote, a tags. AI-generated articles include citation links.
                </span>
              </div>
              {showPreview ? (
                <div
                  className="prose-content min-h-[400px] rounded-lg border border-neutral-200 bg-white p-4"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="h-[480px] w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 p-3 font-mono text-[11px] leading-relaxed outline-none focus:border-sky-400 focus:bg-white"
                  placeholder="<h2>Section</h2><p>Body…</p>"
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Cover image</div>
              {coverImageUrl ? (
                <div className="relative overflow-hidden rounded-lg border border-neutral-200">
                  <img src={coverImageUrl} alt="" className="aspect-[16/9] w-full object-cover" />
                  <button
                    onClick={() => setCoverImageUrl("")}
                    className="absolute right-2 top-2 rounded-md bg-black/60 p-1 text-white hover:bg-black/80"
                    title="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex aspect-[16/9] w-full items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50">
                  <ImageIcon className="h-6 w-6 text-neutral-300" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
                  {uploadingImage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Upload image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadCover(f);
                    }}
                  />
                </label>
                {!isNew && (
                  <button
                    onClick={handleRegenerateImage}
                    disabled={regeneratingImage}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100 disabled:opacity-40"
                  >
                    {regeneratingImage ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    Regenerate with AI
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Metadata</div>
              <ModalInput label="Slug" value={slug} onChange={setSlug} />
              <div>
                <label className="mb-1 block text-[11px] font-medium text-neutral-600">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-sky-400"
                >
                  <option>Surveillance</option>
                  <option>AMR</option>
                  <option>Outbreaks</option>
                  <option>Stewardship</option>
                  <option>Briefing</option>
                  <option>Research</option>
                  <option>Product</option>
                </select>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-neutral-300"
                />
                Featured article
              </label>
              <ModalInput label="Meta title (60 chars)" value={metaTitle} onChange={setMetaTitle} />
              <div>
                <label className="mb-1 block text-[11px] font-medium text-neutral-600">Meta description</label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs outline-none focus:border-sky-400 focus:bg-white"
                />
              </div>
              <ModalInput label="Keywords (comma-separated)" value={keywords} onChange={setKeywords} />
            </CardContent>
          </Card>
        </div>
      </div>

      <style>{`
        .prose-content h1,
        .prose-content h2,
        .prose-content h3 { font-weight: 700; color: #111827; margin-top: 1rem; margin-bottom: 0.5rem; }
        .prose-content h2 { font-size: 1.25rem; }
        .prose-content h3 { font-size: 1.05rem; }
        .prose-content p { margin: 0.6rem 0; line-height: 1.6; color: #374151; font-size: 0.875rem; }
        .prose-content a { color: #0284c7; text-decoration: underline; }
        .prose-content ul, .prose-content ol { margin: 0.6rem 0 0.6rem 1.25rem; }
        .prose-content li { margin: 0.25rem 0; font-size: 0.875rem; color: #374151; }
        .prose-content blockquote { border-left: 3px solid #e5e7eb; padding-left: 0.75rem; color: #4b5563; margin: 0.75rem 0; }
        .prose-content strong { font-weight: 600; color: #111827; }
        .prose-content em { font-style: italic; }
      `}</style>
    </div>
  );
}
