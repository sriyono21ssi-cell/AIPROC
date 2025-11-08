
import React from 'react';
import { Icon } from 'components/icons/Icon';

export const MinusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </Icon>
);