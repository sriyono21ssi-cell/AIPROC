
import React from 'react';
import { Icon } from 'components/icons/Icon';

export const ScaleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}>
    <path d="M16 16l3-8 3 8c-2 1-4 1-6 0z"></path>
    <path d="M2 16l3-8 3 8c-2 1-4 1-6 0z"></path>
    <path d="M12 2v2"></path>
    <path d="M7 16h10"></path>
    <path d="M12 4L2 16"></path>
    <path d="M12 4l10 12"></path>
  </Icon>
);