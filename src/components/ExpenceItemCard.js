import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import tailwind from 'twrnc'

const ExpenceItemCard = ({ item }) => {
    return (
        // title, icon, amount, date, amt
        <View style={tailwind`bg-white rounded-2xl p-4 mx-5 shadow-sm mb-3 flex-row justify-between items-centers`}>
            <View style={tailwind`flex-row items-center`}>


                {/* Icon view start*/}
                <View style={tailwind`w-12 h-12 bg-gray-100 rounded-xl justify-center items-center mr-4`}>
                    <Text style={tailwind`text-2xl`}>{
                        item.icon || "🍔"
                    }</Text>
                </View>
                {/* End Icon view */}



                {/* Title  view */}
                <View >
                    <Text style={tailwind`text-base font-semibold text-gray-800`}> {item.title || "Food"} </Text>

                    {/* Category view start */}
                    <View style={[tailwind`mt-1 px-2 py-1 rounded-lg bg-orange-400  self-start`, {backgroundColor: item.color || "#FF6B6B"}]}>
                        <Text style={tailwind`text-xs font-bold text-gray-700`}> {item.category || "Food and Drinks"} </Text>
                    </View>
                    {/* Category view end */}

                </View>
                {/* End Title view */}


                

            </View>

            {/* Date and amount view start */}
            <View style={tailwind`items-end`}>

                    <Text style={tailwind`text-base font-bold text-black`}>
                        ${item.amount || "20.00"}
                    </Text>
                    <Text style={tailwind`text-sm text-gray-500 mt-1`}>
                        {item.date ||"12 Aug, 2023" }
                    </Text>

                </View>  
            {/* Date and amount view end */}
        </View>
    )
}

export default ExpenceItemCard

const styles = StyleSheet.create({})