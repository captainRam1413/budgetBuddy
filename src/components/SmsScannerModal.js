import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, FlatList, TextInput, SafeAreaView, TouchableOpacity, Animated, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import tailwind from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const SmsScannerModal = ({ visible, onClose, onImport, defaultCategories = [] }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [timeFilter, setTimeFilter] = useState('This Week');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');

  const slideAnim = React.useRef(new Animated.Value(200)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setLoading(true);
      setSelectedItems(new Set());
      
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true })
      ]).start();

      setTimeout(() => {
        setMessages([]);
        setLoading(false);
      }, 500);
    } else {
      slideAnim.setValue(200);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const filteredMessages = messages.filter(msg => {
    const msgDate = new Date(msg.date);
    const now = new Date();
    
    if (timeFilter === 'Today') {
      return msgDate.toDateString() === now.toDateString();
    } else if (timeFilter === 'This Week') {
      const diffTime = Math.abs(now - msgDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays <= 7;
    } else if (timeFilter === 'This Month') {
      return msgDate.getMonth() === now.getMonth() && msgDate.getFullYear() === now.getFullYear();
    }
    return true; // All
  });

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    if (selectedItems.size === filteredMessages.length && filteredMessages.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredMessages.map(m => m.id)));
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditTitle(item.parsedEntity);
    setEditAmount(item.parsedAmount.toString());
  };

  const saveEdit = () => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === editingId) {
        return {
          ...msg,
          parsedEntity: editTitle,
          parsedAmount: parseFloat(editAmount) || msg.parsedAmount
        };
      }
      return msg;
    }));
    setEditingId(null);
  };

  const handleImport = () => {
    if (selectedItems.size === 0) {
      Alert.alert("Notice", "Select at least one expense to import.");
      return;
    }
    
    const itemsToImport = messages
      .filter(m => selectedItems.has(m.id))
      .map(m => ({
        amount: m.parsedAmount,
        title: m.parsedEntity,
        category: m.category,
        date: m.date.toISOString(),
        type: 'debit'
      }));
      
    onImport(itemsToImport);
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedItems.has(item.id);
    const isEditing = editingId === item.id;

    return (
      <View style={[
        tailwind`mb-4 rounded-2xl p-4 shadow-sm border`, 
        { 
          backgroundColor: isSelected ? colors.primary + '10' : colors.surface,
          borderColor: isSelected ? colors.primary : colors.borderLight,
        }
      ]}>
        {/* SMS Original Body */}
        <View style={tailwind`mb-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 opacity-80`}>
           <Text style={[tailwind`text-xs italic`, { color: colors.textSecondary }]}>"{item.body}"</Text>
        </View>

        <View style={tailwind`flex-row items-center`}>
          {/* Checkbox */}
          <Pressable 
            onPress={() => toggleSelect(item.id)}
            style={[
              tailwind`w-6 h-6 rounded mr-4 items-center justify-center border-2`,
              {
                borderColor: isSelected ? colors.primary : colors.textTertiary,
                backgroundColor: isSelected ? colors.primary : 'transparent'
              }
            ]}
          >
            {isSelected && <Text style={tailwind`text-white text-xs font-bold`}>✓</Text>}
          </Pressable>

          {/* Details & Edit */}
          {isEditing ? (
             <View style={tailwind`flex-1 gap-2`}>
                <TextInput 
                  style={[tailwind`p-2 rounded-lg border`, { borderColor: colors.border, color: colors.text, backgroundColor: colors.input }]}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Expense Title"
                  placeholderTextColor={colors.placeholder}
                />
                <TextInput 
                  style={[tailwind`p-2 rounded-lg border`, { borderColor: colors.border, color: colors.text, backgroundColor: colors.input }]}
                  value={editAmount}
                  onChangeText={setEditAmount}
                  placeholder="Amount"
                  keyboardType="numeric"
                  placeholderTextColor={colors.placeholder}
                />
                <Pressable onPress={saveEdit} style={[tailwind`self-end px-4 py-2 rounded-xl mt-1`, { backgroundColor: colors.primary }]}>
                  <Text style={tailwind`text-white font-bold text-xs`}>Save</Text>
                </Pressable>
             </View>
          ) : (
            <View style={tailwind`flex-1 flex-row justify-between items-center`}>
              <View>
                <Text style={[tailwind`text-base font-bold`, { color: colors.text }]}>{item.parsedEntity}</Text>
                <View style={tailwind`flex-row items-center mt-1`}>
                  <Text style={[tailwind`text-xs mr-2`, { color: colors.textSecondary }]}>{item.date.toLocaleDateString()}</Text>
                  <View style={[tailwind`px-2 py-0.5 rounded-full flex-row items-center`, { backgroundColor: item.category.color + '20' }]}>
                    <Text style={tailwind`text-[10px] mr-1`}>{item.category.icon}</Text>
                    <Text style={[tailwind`text-[10px] font-bold`, { color: item.category.color }]}>{item.category.name}</Text>
                  </View>
                </View>
              </View>
              
              <View style={tailwind`items-end`}>
                <Text style={[tailwind`text-lg font-bold`, { color: colors.error || '#EF4444' }]}>₹{item.parsedAmount}</Text>
                <Pressable onPress={() => startEditing(item)} style={tailwind`mt-1`}>
                  <Text style={[tailwind`text-xs font-bold`, { color: colors.primary }]}>✏️ Edit</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tailwind`flex-1`}>
        <View style={[tailwind`flex-1 justify-end`, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <Animated.View style={[
            tailwind`rounded-t-3xl pt-2 pb-8 h-[85%]`, 
            { backgroundColor: colors.background, transform: [{ translateY: slideAnim }], opacity: fadeAnim }
          ]}>
            {/* Handle Bar */}
            <View style={[tailwind`w-12 h-1.5 rounded-full self-center mb-4 mt-2`, { backgroundColor: colors.border }]} />
            
            {/* Header */}
            <View style={tailwind`px-6 flex-row justify-between items-center mb-4`}>
              <View>
                <Text style={[tailwind`text-2xl font-bold`, { color: colors.text }]}>SMS Scanner</Text>
                <Text style={[tailwind`text-sm`, { color: colors.textSecondary }]}>Find expenses in your messages</Text>
              </View>
              <Pressable onPress={onClose} style={[tailwind`w-8 h-8 rounded-full items-center justify-center`, { backgroundColor: colors.borderLight }]}>
                <Text style={[tailwind`text-xl font-bold`, { color: colors.textSecondary }]}>✕</Text>
              </Pressable>
            </View>

            {loading ? (
              <View style={tailwind`flex-1 items-center justify-center`}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[tailwind`mt-4 font-medium`, { color: colors.textSecondary }]}>Scanning bank messages natively...</Text>
                <Text style={[tailwind`mt-2 text-xs italic`, { color: colors.textTertiary }]}>Finding amounts and merchants...</Text>
              </View>
            ) : (
              <View style={tailwind`flex-1`}>
                {/* Time Filters */}
                <View style={tailwind`px-6 mb-4`}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tailwind`gap-3`}>
                    {['Today', 'This Week', 'This Month', 'All'].map(filter => (
                      <Pressable 
                        key={filter}
                        onPress={() => setTimeFilter(filter)}
                        style={[
                          tailwind`px-5 py-2.5 rounded-full border flex-row items-center justify-center`,
                          { 
                            backgroundColor: timeFilter === filter ? colors.primary : colors.surface,
                            borderColor: timeFilter === filter ? colors.primary : colors.border
                          }
                        ]}
                      >
                        <Text 
                          style={[
                            tailwind`font-bold text-sm`,
                            { color: timeFilter === filter ? '#FFFFFF' : colors.textSecondary }
                          ]}
                          numberOfLines={1}
                        >
                          {filter}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                {/* Select All Row */}
                <View style={tailwind`px-6 flex-row justify-between items-center mb-2`}>
                  <Text style={[tailwind`font-medium`, { color: colors.textSecondary }]}>{filteredMessages.length} transactions found</Text>
                  <TouchableOpacity onPress={selectAll}>
                    <Text style={[tailwind`font-bold`, { color: colors.primary }]}>
                      {selectedItems.size === filteredMessages.length && filteredMessages.length > 0 ? 'Deselect All' : 'Select All'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* List */}
                <FlatList 
                  data={filteredMessages}
                  keyExtractor={item => item.id}
                  renderItem={renderItem}
                  contentContainerStyle={tailwind`px-6 pb-20`}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={tailwind`items-center justify-center py-10`}>
                      {/* You can restore an empty state message here when real SMS hooks are active */}
                    </View>
                  }
                />

                {/* Floating Bottom Import Button */}
                <View style={[tailwind`absolute bottom-0 w-full p-6 pt-4`, { backgroundColor: colors.background }]}>
                   <Pressable
                     onPress={handleImport}
                     disabled={selectedItems.size === 0}
                     style={({pressed}) => [
                       tailwind`rounded-2xl shadow-lg overflow-hidden flex-row justify-center items-center`,
                       { transform: [{ scale: pressed ? 0.97 : 1 }], opacity: selectedItems.size === 0 ? 0.5 : 1 }
                     ]}
                   >
                     <LinearGradient
                        colors={[colors.primary, colors.primaryDark || '#4f46e5']}
                        style={tailwind`p-4 w-full flex-row justify-center items-center`}
                     >
                       <Text style={tailwind`text-white text-lg font-bold`}>
                         Import {selectedItems.size > 0 ? selectedItems.size : ''} Expense{selectedItems.size !== 1 ? 's' : ''}
                       </Text>
                     </LinearGradient>
                   </Pressable>
                </View>
              </View>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default SmsScannerModal;
