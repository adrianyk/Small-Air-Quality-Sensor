import { View, DimensionValue } from 'react-native'
import React from 'react'


type SpacerProps = {
  width?: DimensionValue
  height?: DimensionValue
  className?: string
}

const Spacer = ({ width = '100%', height = 40, className = '' }: SpacerProps) => {
  return (
    <View 
        className={className} style={{ width, height }}
    />
  )
}

export default Spacer