import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';

interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

interface FormFieldLabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

interface FormFieldControlProps {
  children: React.ReactNode;
  className?: string;
}

interface FormFieldDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface FormFieldMessageProps {
  children?: React.ReactNode;
  type?: 'error' | 'warning' | 'info';
  className?: string;
}

const FormFieldContext = React.createContext<{
  fieldId: string;
  hasError: boolean;
  hasDescription: boolean;
}>({
  fieldId: '',
  hasError: false,
  hasDescription: false,
});

export function FormField({ children, className }: FormFieldProps) {
  const fieldId = React.useId();
  const [hasError, setHasError] = React.useState(false);
  const [hasDescription, setHasDescription] = React.useState(false);

  const contextValue = React.useMemo(
    () => ({
      fieldId,
      hasError,
      hasDescription,
    }),
    [fieldId, hasError, hasDescription]
  );

  return (
    <FormFieldContext.Provider value={contextValue}>
      <div className={cn('space-y-2', className)}>
        {children}
      </div>
    </FormFieldContext.Provider>
  );
}

export function FormFieldLabel({ 
  children, 
  htmlFor, 
  required, 
  className 
}: FormFieldLabelProps) {
  const { fieldId } = React.useContext(FormFieldContext);
  
  return (
    <Label
      htmlFor={htmlFor || fieldId}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
    >
      {children}
      {required && (
        <span className="text-red-500 ml-1" aria-label="必須">
          *
        </span>
      )}
    </Label>
  );
}

export function FormFieldControl({ children, className }: FormFieldControlProps) {
  const { fieldId, hasError, hasDescription } = React.useContext(FormFieldContext);

  return (
    <div className={cn('relative', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            id: child.props.id || fieldId,
            'aria-describedby': hasDescription ? `${fieldId}-description` : undefined,
            'aria-invalid': hasError ? 'true' : undefined,
            className: cn(
              child.props.className,
              hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500'
            ),
          });
        }
        return child;
      })}
    </div>
  );
}

export function FormFieldDescription({ children, className }: FormFieldDescriptionProps) {
  const { fieldId } = React.useContext(FormFieldContext);

  React.useEffect(() => {
    // hasDescriptionを更新する方法が必要だが、今回は簡略化
  }, []);

  return (
    <p
      id={`${fieldId}-description`}
      className={cn('text-sm text-muted-foreground', className)}
    >
      {children}
    </p>
  );
}

export function FormFieldMessage({ 
  children, 
  type = 'error', 
  className 
}: FormFieldMessageProps) {
  const { fieldId } = React.useContext(FormFieldContext);

  if (!children) return null;

  const typeStyles = {
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  };

  return (
    <p
      id={`${fieldId}-message`}
      className={cn(
        'text-sm font-medium',
        typeStyles[type],
        className
      )}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      {children}
    </p>
  );
}

// 使いやすいラッパーコンポーネント
interface SimpleFormFieldProps {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function SimpleFormField({
  label,
  required,
  description,
  error,
  children,
  className,
}: SimpleFormFieldProps) {
  return (
    <FormField className={className}>
      <FormFieldLabel required={required}>
        {label}
      </FormFieldLabel>
      <FormFieldControl>
        {children}
      </FormFieldControl>
      {description && (
        <FormFieldDescription>
          {description}
        </FormFieldDescription>
      )}
      {error && (
        <FormFieldMessage type="error">
          {error}
        </FormFieldMessage>
      )}
    </FormField>
  );
}