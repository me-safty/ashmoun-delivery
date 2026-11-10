import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api";
import { errorMessage } from "@/lib/errors";
import { colors, fonts, radius, space } from "@/theme";
import { AppText } from "./app-text";
import { Button } from "./button";
import { TextField } from "./text-field";

const STAR = "#F5B301";
const MAX_COMMENT = 300;

type Props = {
  shopId: string;
  rating?: number;
  reviewsCount?: number;
};

type ReviewItem = {
  _id: string;
  rating: number;
  comment: string;
  createdAt: number;
  authorName: string;
};

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function Stars({ rating, size }: { rating?: number; size: number }) {
  const value = rating ?? 0;
  return (
    <View style={styles.stars}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Ionicons key={i} name={i < Math.round(value) ? "star" : "star-outline"} size={size} color={STAR} />
      ))}
    </View>
  );
}

export function ShopReviews({ shopId, rating, reviewsCount }: Props) {
  const me = useQuery(api.users.me);
  const mine = useQuery(api.reviews.mine, { shopId });
  const reviews = useQuery(api.reviews.list, { shopId });

  const [starRating, setStarRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const existing = mine === undefined ? undefined : (mine ?? null);

  // Pre-fill the form from the user's stored review. Resetting during render
  // (not in an effect) avoids cascading renders; the watermark only changes
  // when the stored review itself changes, preserving in-progress edits.
  const watermark =
    existing === undefined ? null : `${shopId}:${existing?._id ?? "new"}:${existing?.rating ?? 0}`;
  const [syncedWatermark, setSyncedWatermark] = useState<string | null>(null);
  if (watermark !== null && watermark !== syncedWatermark) {
    setSyncedWatermark(watermark);
    setStarRating(existing?.rating ?? 0);
    setComment(existing?.comment ?? "");
  }

  const add = useMutation(api.reviews.add);

  const submit = async () => {
    setError("");
    if (starRating < 1) {
      setError("يرجى اختيار تقييم");
      return;
    }
    setSaving(true);
    try {
      await add({ shopId, rating: starRating, comment });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <AppText variant="title">التقييمات</AppText>
        {reviewsCount ? (
          <View style={styles.countPill}>
            <AppText variant="caption" tone="primaryInk">
              {reviewsCount}
            </AppText>
          </View>
        ) : null}
      </View>

      {rating != null && (
        <View style={styles.summary}>
          <AppText variant="subtitle">{rating.toFixed(1)}</AppText>
          <Stars rating={rating} size={16} />
        </View>
      )}

      <View style={styles.form}>
        <AppText variant="subtitle">{existing ? "قيّمك" : "شاركنا تقييمك"}</AppText>
        <View style={styles.starPicker}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Pressable
              key={i}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`تقييم ${i + 1} من 5`}
              onPress={() => setStarRating(i + 1)}>
              <Ionicons name={i < starRating ? "star" : "star-outline"} size={30} color={STAR} />
            </Pressable>
          ))}
        </View>
        <TextField
          label="ملاحظاتك (اختياري)"
          value={comment}
          onChangeText={setComment}
          maxLength={MAX_COMMENT}
          style={styles.comment}
          multiline
          textAlignVertical="top"
        />
        {me === null ? (
          <Pressable
            accessibilityRole="link"
            style={styles.signIn}
            onPress={() => router.push("/sign-in")}>
            <AppText variant="subtitle" tone="primary">
              سجّل الدخول لإضافة تقييمك
            </AppText>
            <Ionicons name="chevron-back" size={18} color={colors.primary} />
          </Pressable>
        ) : (
          <Button
            label={existing ? "تحديث تقييمي" : "إرسال التقييم"}
            loading={saving}
            disabled={starRating < 1 || saving}
            onPress={submit}
          />
        )}
        {error ? (
          <AppText variant="caption" tone="danger">
            {error}
          </AppText>
        ) : null}
      </View>

      {reviews === undefined ? (
        <ActivityIndicator style={styles.listLoading} color={colors.primary} />
      ) : (reviews ?? []).length === 0 ? (
        <AppText variant="body" tone="muted" style={styles.empty}>
          لا توجد تقييمات بعد، كن أول من يقيّم هذا المحل
        </AppText>
      ) : (
        (reviews ?? []).map((review: ReviewItem) => (
          <View key={review._id} style={styles.review}>
            <View style={styles.reviewHead}>
              <View style={styles.avatar}>
                <AppText variant="subtitle" tone="primaryInk">
                  {(review.authorName || "؟").trim().charAt(0)}
                </AppText>
              </View>
              <View style={styles.reviewHeadBody}>
                <AppText variant="subtitle" numberOfLines={1}>
                  {review.authorName || "مستخدم"}
                </AppText>
                <Stars rating={review.rating} size={14} />
              </View>
              <AppText variant="caption" tone="muted">
                {formatDate(review.createdAt)}
              </AppText>
            </View>
            {review.comment ? (
              <AppText variant="body" tone="muted">
                {review.comment}
              </AppText>
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    gap: space.md,
  },
  headingRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  countPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  summary: { flexDirection: "row", alignItems: "center", gap: space.xs },
  stars: { flexDirection: "row", gap: 2 },
  form: {
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  starPicker: { flexDirection: "row", gap: space.xs, alignSelf: "flex-end" },
  comment: { minHeight: 96, fontFamily: fonts.regular },
  signIn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
    minHeight: 52,
  },
  listLoading: { marginVertical: space.md },
  empty: { textAlign: "center" },
  review: {
    gap: space.xs,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewHead: { flexDirection: "row", alignItems: "center", gap: space.sm },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewHeadBody: { flex: 1, gap: 2 },
});
