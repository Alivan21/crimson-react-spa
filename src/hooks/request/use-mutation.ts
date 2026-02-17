import {
  QueryClient,
  type UseMutationOptions,
  useMutation as useMutationOrigin,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import type { TErrorResponse } from "@/common/types/base-response";

export const useMutation = <
  TData = unknown,
  TError = AxiosError<TErrorResponse>,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
  queryClient?: QueryClient
) => useMutationOrigin<TData, TError, TVariables, TContext>(options, queryClient);
