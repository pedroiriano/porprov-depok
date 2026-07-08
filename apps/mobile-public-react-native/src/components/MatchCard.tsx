import React from 'react';
import { View, Text } from 'react-native';

interface MatchCardProps {
  caborName: string;
  round: string;
  team1: string;
  team2: string;
  score1?: string;
  score2?: string;
  status: 'LIVE' | 'FINISHED' | 'UPCOMING';
  time: string;
}

export function MatchCard({
  caborName,
  round,
  team1,
  team2,
  score1,
  score2,
  status,
  time,
}: MatchCardProps) {
  return (
    <View className="bg-slate-800 rounded-xl overflow-hidden mb-4 border border-slate-700 shadow-sm">
      {/* Header */}
      <View className="flex-row justify-between items-center bg-slate-900/50 px-4 py-2 border-b border-slate-700">
        <Text className="text-slate-300 font-semibold text-xs uppercase">{caborName}</Text>
        <Text className="text-slate-400 font-medium text-xs">{round}</Text>
      </View>

      {/* Body */}
      <View className="p-4 flex-row items-center justify-between">
        {/* Team 1 */}
        <View className="flex-1 items-end pr-4">
          <Text className="text-slate-100 font-bold text-base" numberOfLines={1}>
            {team1}
          </Text>
        </View>

        {/* Score / Time */}
        <View className="items-center w-24">
          {status === 'UPCOMING' ? (
            <View className="bg-slate-700 px-3 py-1.5 rounded-lg">
              <Text className="text-slate-200 font-bold">{time}</Text>
            </View>
          ) : (
            <View className="flex-row items-center justify-center space-x-2 gap-2">
              <Text className={`text-2xl font-black ${score1 && score2 && parseInt(score1) > parseInt(score2) ? 'text-primary-400' : 'text-slate-200'}`}>
                {score1 ?? '-'}
              </Text>
              <Text className="text-slate-500 font-bold">-</Text>
              <Text className={`text-2xl font-black ${score1 && score2 && parseInt(score2) > parseInt(score1) ? 'text-primary-400' : 'text-slate-200'}`}>
                {score2 ?? '-'}
              </Text>
            </View>
          )}

          {/* Status Badge */}
          {status === 'LIVE' && (
            <View className="mt-2 bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/50">
              <Text className="text-red-400 font-bold text-[10px]">LIVE</Text>
            </View>
          )}
          {status === 'FINISHED' && (
            <View className="mt-2 bg-slate-700/50 px-2 py-0.5 rounded-full">
              <Text className="text-slate-400 font-bold text-[10px]">SELESAI</Text>
            </View>
          )}
        </View>

        {/* Team 2 */}
        <View className="flex-1 items-start pl-4">
          <Text className="text-slate-100 font-bold text-base" numberOfLines={1}>
            {team2}
          </Text>
        </View>
      </View>
    </View>
  );
}
