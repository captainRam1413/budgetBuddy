//Modal screen for creating a new category and selecting new category.
import { Pressable, StyleSheet, Text, View,FlatList } from 'react-native'
import React from 'react'
import tailwind from 'twrnc'
import { CATEGORY } from '../constant'
// import { FlatList } from 'react-native/types_generated/index'



const Category = ({navigation}) => {

    const renderItem = ({item}) => {
        return (
        <Pressable 
        onPress={() => handleSelectedCategory(item)}
        style={tailwind`border  m-2 border-gray-300 shadow-sm p-4 bg-white rounded-xl flex-1 items-center justify-center`} >
            <Text style={tailwind`text-4xl`}>{item.icon}</Text>
            <Text style={tailwind`text-center mt-2  text-sm font-medium text-gray-700`}>{item.name}</Text>
            </Pressable>
        );
    };

    const handleSelectedCategory = (item) => {
        // console.log("Selected category:", item);
        // navigation.goBack();
        navigation.popTo("BottomTabs",{
            screen: "Create",
            params: {item}
        });
    }

  return (
    <View>
      {/* <Text>Category</Text> */}
      <View style={tailwind`p-5`}>
        <Pressable onPress={() => navigation.goBack()}>
            <Text style={tailwind`text-2xl font-bold`}>X</Text>
        </Pressable>

        <Text style={tailwind`text-3xl font-bold text-black mt-4`}>
            Select Category
        </Text>
        <Text style={tailwind`text-base mb-4 mt-2 text-gray-500`}>
            Select a category; that best describes what you spend money on.
        </Text>
      </View>

        <FlatList 
        data={CATEGORY}
        renderItem={renderItem}
        keyExtractor={(item) => item.name}
        numColumns={2}
        columnWrapperStyle={tailwind`px-5`}
        />
    </View>
    );
}

export default Category

const styles = StyleSheet.create({})