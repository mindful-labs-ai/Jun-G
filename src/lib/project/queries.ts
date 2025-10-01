import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateProjectInput } from './types';
import {
  createProject,
  getProjectBundle,
  getProjects,
  updatePreferences,
  updateScript,
} from './project';
import { QUERY_KEY } from '../shared/constant';

export const useCreateMutation = (userId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateProjectInput) =>
      await createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.PROJECT_LIST(userId),
      });
    },
  });
};

export const useGetProjectList = (userId: number) => {
  return useQuery({
    queryKey: QUERY_KEY.PROJECT_LIST(userId),
    enabled: !!userId,
    queryFn: async () => getProjects(userId),
  });
};

export const useGetProjectBundle = (
  projectId: number | null,
  signal: number
) => {
  return useQuery({
    queryKey: QUERY_KEY.PROJECT_BUNDLE(projectId!),
    queryFn: () => getProjectBundle(projectId!),
    enabled: signal !== 0,
    staleTime: 60_000,
  });
};

export const usePrefetchProject = () => {
  const queryClient = useQueryClient();
  return (id: number) =>
    queryClient.prefetchQuery({
      queryKey: QUERY_KEY.PROJECT_BUNDLE(id),
      queryFn: () => getProjectBundle(id),
      staleTime: 60_000,
    });
};

export const useUpdatePreferencesAndScript = (projectId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      patch,
      script,
      isPrefChange,
      isScriptChange,
    }: {
      patch: Record<string, unknown>;
      script: string;
      isPrefChange: boolean;
      isScriptChange: boolean;
    }) => {
      if (isPrefChange) {
        await updatePreferences(projectId, patch);
      }

      if (isScriptChange) {
        await updateScript({ projectId, script });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.PROJECT_BUNDLE(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.PROJECT_LIST(projectId),
      });
    },
  });
};
