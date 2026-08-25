import { Text, View } from 'react-native';
import React from 'react';
import tailwind from 'twrnc';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../helper';

const ExpenceItemCard = ({ item, index = 0 }) => {
  const { colors } = useTheme();
  const defaultColor = '#FF6B6B';

  return (
    <View style={[tailwind`rounded-2xl p-4 shadow-sm mb-3`, { backgroundColor: colors.surface }]}>
      <View style={tailwind`flex-row justify-between items-center`}>
        <View style={tailwind`flex-row items-center flex-1`}>
          {/* Icon view */}
          <View style={[tailwind`w-12 h-12 rounded-xl justify-center items-center mr-4`, { backgroundColor: (item.color || defaultColor) + '20' }]}>
            <Text style={tailwind`text-2xl`}>{item.icon || "🍔"}</Text>
          </View>

          {/* Title view */}
          <View style={tailwind`flex-1`}>
            <Text style={[tailwind`text-base font-semibold`, { color: colors.text }]}>
              {item.title || "Untitled"}
            </Text>

            {/* Category badge */}
            <View style={[tailwind`mt-1 px-2 py-1 rounded-lg self-start`, { backgroundColor: (item.color || defaultColor) + '20' }]}>
              <Text style={[tailwind`text-xs font-bold`, { color: item.color || defaultColor }]}>
                {item.category || "General"}
              </Text>
            </View>
          </View>
        </View>

        {/* Date and amount view */}
        <View style={tailwind`items-end`}>
          <Text style={[tailwind`text-lg font-bold`, { color: colors.text }]}>
            {formatCurrency(item.amount || 0)}
          </Text>
          <Text style={[tailwind`text-xs mt-1`, { color: colors.textTertiary }]}>
            {item.date || ""}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ExpenceItemCard;