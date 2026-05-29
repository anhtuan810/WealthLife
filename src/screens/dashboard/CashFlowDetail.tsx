import React from 'react';
import type { Player } from '../../game/player';
import { colors } from '../../theme';
import { DetailSheet, Note, Row, Section } from './DetailSheet';
import { cashFlowBreakdown } from '../../game/cashFlow';

type Props = {
  player: Player;
  visible: boolean;
  onClose: () => void;
};

// Money-flow strings used inside the sheet. Distinct from the dashboard's
// fmtMoney/fmtSigned so this view can lead with a "+$" / "−$" cue on every
// flow row without affecting plain-cash rendering elsewhere.
function fmtIn(n: number) {
  return `+$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
}
function fmtOut(n: number) {
  return `-$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
}
function fmtSigned(n: number) {
  const r = Math.round(n);
  if (r === 0) return '$0';
  const sign = r < 0 ? '-' : '+';
  return `${sign}$${Math.abs(r).toLocaleString('en-US')}`;
}

export function CashFlowDetail({ player, visible, onClose }: Props) {
  const b = cashFlowBreakdown(player);
  const netPositive = b.net >= 0;
  const netColor = netPositive ? colors.emerald : colors.warmDebt;

  return (
    <DetailSheet
      visible={visible}
      onClose={onClose}
      eyebrow="NEXT MONTH · PROJECTED"
      title="Cash Flow"
    >
      <Section label="IN">
        <Row
          label="Active income"
          value={fmtIn(b.active)}
          valueColor={colors.emerald}
        />
        <Row
          label="Passive income"
          value={fmtIn(b.passive)}
          valueColor={colors.emerald}
        />
        <Row
          label="Total in"
          value={fmtIn(b.inflowTotal)}
          emphasis="total"
          valueColor={colors.emerald}
        />
      </Section>

      <Section label="OUT">
        <Row
          label="Living expenses"
          value={fmtOut(b.expenses)}
          valueColor={colors.warmDebt}
        />
        <Row
          label="Total out"
          value={fmtOut(b.outflowTotal)}
          emphasis="total"
          valueColor={colors.warmDebt}
        />
      </Section>

      <Row
        label="NET · PROJECTED"
        value={fmtSigned(b.net)}
        emphasis="net"
        valueColor={netColor}
      />

      <Note>
        {netPositive
          ? `You're banking about ${fmtSigned(b.net)} next month after expenses.`
          : `You're short about ${fmtSigned(
              Math.abs(b.net),
            )} next month — that eats into your cash, and anything past zero rolls into debt.`}
      </Note>
    </DetailSheet>
  );
}
