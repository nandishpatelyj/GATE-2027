import { useMemo, useCallback } from 'react';
import {
  ErrorLogEntry,
  RevisionQueueItem,
  SyllabusTopic,
} from '../types';
import { SPACED_REVISION_INTERVALS } from '../data/badges';
import { addDays, diffDays, getLocalDateString } from '../utils/dateUtils';

interface UseRevisionQueueParams {
  topics: SyllabusTopic[];
  setTopics: (
    val: SyllabusTopic[] | ((prev: SyllabusTopic[]) => SyllabusTopic[])
  ) => void;
  errorLogs: ErrorLogEntry[];
  setErrorLogs: (
    val: ErrorLogEntry[] | ((prev: ErrorLogEntry[]) => ErrorLogEntry[])
  ) => void;
  onRevisionCompleted?: (item: RevisionQueueItem) => void;
}

export function useRevisionQueue({
  topics,
  setTopics,
  errorLogs,
  setErrorLogs,
  onRevisionCompleted,
}: UseRevisionQueueParams) {
  const todayStr = getLocalDateString();

  const allQueueItems = useMemo(() => {
    const items: RevisionQueueItem[] = [];

    topics.forEach((t) => {
      if (
        (t.status === 'practised' || t.status === 'revised') &&
        t.nextRevisionDate &&
        (t.revisionStage ?? 0) < SPACED_REVISION_INTERVALS.length
      ) {
        const stage = t.revisionStage ?? 0;
        const intervalDays = SPACED_REVISION_INTERVALS[stage] ?? 45;
        const delta = diffDays(todayStr, t.nextRevisionDate);
        items.push({
          id: `rev_topic_${t.id}`,
          sourceId: t.id,
          type: 'topic',
          subjectId: t.subjectId,
          topicId: t.id,
          title: t.title,
          subtitle: `Syllabus Topic · Cycle ${stage + 1}/${SPACED_REVISION_INTERVALS.length} (${intervalDays}d interval)`,
          stage,
          intervalDays,
          dueDate: t.nextRevisionDate,
          isOverdue: delta < 0,
          isDueToday: delta <= 0,
        });
      }
    });

    errorLogs.forEach((err) => {
      if (
        !err.resolved &&
        err.nextRevisionDate &&
        err.revisionStage < SPACED_REVISION_INTERVALS.length
      ) {
        const stage = err.revisionStage ?? 0;
        const intervalDays = SPACED_REVISION_INTERVALS[stage] ?? 45;
        const delta = diffDays(todayStr, err.nextRevisionDate);
        items.push({
          id: `rev_error_${err.id}`,
          sourceId: err.id,
          type: 'error',
          subjectId: err.subjectId,
          topicId: err.topicId,
          title: err.questionSummary,
          subtitle: `${err.mistakeType} · Cycle ${stage + 1}/${SPACED_REVISION_INTERVALS.length} (${intervalDays}d interval)`,
          stage,
          intervalDays,
          dueDate: err.nextRevisionDate,
          isOverdue: delta < 0,
          isDueToday: delta <= 0,
        });
      }
    });

    return items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [topics, errorLogs, todayStr]);

  const dueTodayItems = useMemo(
    () => allQueueItems.filter((item) => item.isDueToday),
    [allQueueItems]
  );

  const upcomingItems = useMemo(
    () => allQueueItems.filter((item) => !item.isDueToday),
    [allQueueItems]
  );

  const completeRevision = useCallback(
    (item: RevisionQueueItem) => {
      const nextStage = item.stage + 1;
      const hasMoreCycles = nextStage < SPACED_REVISION_INTERVALS.length;
      const nextDate = hasMoreCycles
        ? addDays(todayStr, SPACED_REVISION_INTERVALS[nextStage])
        : undefined;

      if (item.type === 'topic') {
        setTopics((prev) =>
          prev.map((t) =>
            t.id === item.sourceId
              ? {
                  ...t,
                  status: 'revised',
                  lastRevisedDate: todayStr,
                  revisionStage: nextStage,
                  nextRevisionDate: nextDate,
                }
              : t
          )
        );
      } else {
        setErrorLogs((prev) =>
          prev.map((e) =>
            e.id === item.sourceId
              ? {
                  ...e,
                  lastRevisedDate: todayStr,
                  revisionStage: nextStage,
                  nextRevisionDate: nextDate ?? todayStr,
                  resolved: !hasMoreCycles,
                }
              : e
          )
        );
      }

      onRevisionCompleted?.(item);
    },
    [todayStr, setTopics, setErrorLogs, onRevisionCompleted]
  );

  const postponeRevision = useCallback(
    (item: RevisionQueueItem, daysToSnooze = 1) => {
      const baseDate = item.dueDate > todayStr ? item.dueDate : todayStr;
      const snoozedDate = addDays(baseDate, daysToSnooze);

      if (item.type === 'topic') {
        setTopics((prev) =>
          prev.map((t) =>
            t.id === item.sourceId ? { ...t, nextRevisionDate: snoozedDate } : t
          )
        );
      } else {
        setErrorLogs((prev) =>
          prev.map((e) =>
            e.id === item.sourceId ? { ...e, nextRevisionDate: snoozedDate } : e
          )
        );
      }
    },
    [todayStr, setTopics, setErrorLogs]
  );

  return {
    allQueueItems,
    dueTodayItems,
    upcomingItems,
    completeRevision,
    postponeRevision,
  };
}
