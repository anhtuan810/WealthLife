import React from 'react';
import type { Player } from '../../game/player';
import { TICK_CONFIG } from '../../game/playerConfig';
import { colors } from '../../theme';
import { DetailSheet, Note, Row, Section } from './DetailSheet';
import { debtInterestFor } from '../../game/cashFlow';

type Props = {
  player: Player;
  visible: boolean;
  onClose: () => void;
};

function fmtOut(n: number) {
  return `-$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
}

function fmtGrowth(n: number) {
  return `+$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
}

export function DebtDetail({ player, visible, onClose }: Props) {
  const balance = Math.max(0, Math.round(player.debt));
  // Monthly rate × 12 → simple APR. Same source the engine uses to accrue.
  const aprPct = TICK_CONFIG.debtInterestPerMonth * 12 * 100;
  // Interest is accrued onto the debt principal in tick.ts — it does NOT
  // leave cash. So we present it as the amount the balance grows each month,
  // which is how the player actually feels it (net worth drag, not a bill).
  const monthlyGrowth = debtInterestFor(player);

  return (
    <DetailSheet
      visible={visible}
      onClose={onClose}
      eyebrow="LIABILITIES"
      title="Debt"
    >
      <Section label="POSITION">
        <Row
          label="Balance"
          value={fmtOut(balance)}
          valueColor={colors.warmDebt}
          emphasis="total"
        />
        <Row label="Interest rate" value={`${aprPct.toFixed(1)}% APR`} />
        <Row
          label="Debt growth / month"
          value={fmtGrowth(monthlyGrowth)}
          valueColor={colors.warmDebt}
        />
      </Section>

      <Note>
        {balance > 0
          ? `At ${aprPct.toFixed(1)}% APR, the balance grows by about ${fmtGrowth(
              monthlyGrowth,
            )} a month — interest piles onto what you owe, dragging net worth rather than hitting cash.`
          : 'No outstanding debt.'}
      </Note>
    </DetailSheet>
  );
}
